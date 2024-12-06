import { LocationAnalysis, isValidAreaType } from './types';
import { getPopulationEstimate } from './google-maps';

const GPT_API_URL = 'https://api.openai.com/v1/chat/completions';
const GPT_MODEL = 'gpt-4-turbo-preview';

export async function analyzeLocation(
  address: string,
  coordinates: [number, number]
): Promise<LocationAnalysis> {
  const defaultErrorResponse: LocationAnalysis = {
    location: {
      name: address,
      address: address,
      coordinates: coordinates
    },
    rankings: {
      areaType: {
        value: 'Error',
        description: 'Analysis unavailable'
      },
      population: {
        value: 'API Access Required',
        description: 'Population data unavailable'
      }
    },
    analysis: {
      demographic_profile: 'Analysis unavailable',
      lifestyle_trends: 'Analysis unavailable',
      relevant_industries: 'Analysis unavailable',
      physical_characteristics: 'Analysis unavailable',
      type_of_center: 'Analysis unavailable',
      nearby_businesses: 'Analysis unavailable'
    }
  };

  if (!import.meta.env.VITE_OPENAI_API_KEY) {
    console.error('OpenAI API key is missing');
    return {
      ...defaultErrorResponse,
      error: 'OpenAI API key is required'
    };
  }

  // Get population estimate first
  let population = 0;
  let populationError = false;
  try {
    population = await getPopulationEstimate(coordinates, 5);
    if (population === 0) {
      populationError = true;
    }
  } catch (error) {
    console.error('Error fetching population data:', error);
    populationError = true;
  }

  try {
    const response = await fetch(GPT_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${import.meta.env.VITE_OPENAI_API_KEY}`,
      },
      body: JSON.stringify({
        model: GPT_MODEL,
        messages: [
          {
            role: 'system',
            content: `You are a location analytics expert. Always return analysis in this exact JSON structure:
            {
              "location": {
                "name": "Business/Center name or formatted address",
                "address": "Full address",
                "coordinates": [number, number]
              },
              "rankings": {
                "areaType": {
                  "value": "Urban|Suburban|Rural",
                  "description": "Explanation of area type"
                }
              },
              "analysis": {
                "demographic_profile": "Three sentence description",
                "lifestyle_trends": "Three sentence description",
                "relevant_industries": "Three sentence description",
                "physical_characteristics": "Three sentence description",
                "type_of_center": "Three sentence description",
                "nearby_businesses": "Three sentence description"
              }
            }`
          },
          {
            role: 'user',
            content: `Analyze this location for business potential:
            Address: ${address}
            Coordinates: ${coordinates.join(', ')}
            
            Provide only the JSON response with no additional text or markdown formatting.`
          }
        ],
        temperature: 0,
        response_format: { type: "json_object" }
      }),
    });

    if (!response.ok) {
      console.error('API request failed:', response.status, response.statusText);
      throw new Error(`API request failed with status ${response.status}`);
    }

    const data = await response.json();
    
    if (!data.choices?.[0]?.message?.content) {
      console.error('Invalid GPT response structure:', data);
      throw new Error('Invalid response format from GPT API');
    }

    let parsedResponse;
    try {
      const content = data.choices[0].message.content.trim();
      parsedResponse = JSON.parse(content);
    } catch (parseError) {
      console.error('Parse error:', parseError);
      throw new Error('Failed to parse GPT response');
    }

    // Validate response structure
    if (!parsedResponse?.location?.name || 
        !parsedResponse?.rankings?.areaType?.value ||
        !parsedResponse?.analysis?.demographic_profile) {
      console.error('Invalid response structure:', parsedResponse);
      throw new Error('Invalid response structure from GPT API');
    }

    return {
      location: {
        name: parsedResponse.location.name || address,
        address: address,
        coordinates: coordinates
      },
      rankings: {
        areaType: {
          value: isValidAreaType(parsedResponse.rankings.areaType.value) 
            ? parsedResponse.rankings.areaType.value 
            : 'Error',
          description: parsedResponse.rankings.areaType.description || 'No description available'
        },
        population: {
          value: population > 0 ? `~${population.toLocaleString()}` : 'API Access Required',
          description: populationError 
            ? 'Enable Places API in Google Cloud Console'
            : `Estimated population within 5 miles`
        }
      },
      analysis: {
        demographic_profile: parsedResponse.analysis.demographic_profile || 'No data available',
        lifestyle_trends: parsedResponse.analysis.lifestyle_trends || 'No data available',
        relevant_industries: parsedResponse.analysis.relevant_industries || 'No data available',
        physical_characteristics: parsedResponse.analysis.physical_characteristics || 'No data available',
        type_of_center: parsedResponse.analysis.type_of_center || 'No data available',
        nearby_businesses: parsedResponse.analysis.nearby_businesses || 'No data available'
      }
    };
  } catch (error) {
    console.error('GPT Analysis error:', error);
    return {
      ...defaultErrorResponse,
      error: error instanceof Error ? error.message : 'Failed to analyze location'
    };
  }
}