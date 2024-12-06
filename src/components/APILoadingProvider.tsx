import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { AlertCircle, Loader2 } from 'lucide-react';

interface APIContextType {
  isLoaded: boolean;
  hasError: boolean;
}

const APIContext = createContext<APIContextType>({
  isLoaded: false,
  hasError: false,
});

export const useAPI = () => useContext(APIContext);

interface APILoadingProviderProps {
  children: ReactNode;
}

export function APILoadingProvider({ children }: APILoadingProviderProps) {
  const [state, setState] = useState({
    isLoaded: false,
    hasError: false,
    isChecking: true,
  });

  useEffect(() => {
    let timeoutId: number;

    const checkAPIStatus = () => {
      if (window.google?.maps?.places) {
        setState({ isLoaded: true, hasError: false, isChecking: false });
        return true;
      }
      return false;
    };

    // Check immediately
    if (checkAPIStatus()) {
      return;
    }

    // Set up event listeners
    const handleLoad = () => {
      // Add a small delay to ensure Places library is fully loaded
      setTimeout(() => {
        if (window.google?.maps?.places) {
          setState({ isLoaded: true, hasError: false, isChecking: false });
        } else {
          setState({ isLoaded: false, hasError: true, isChecking: false });
        }
      }, 100);
    };

    const handleError = () => {
      setState({ isLoaded: false, hasError: true, isChecking: false });
    };

    window.addEventListener('google-maps-loaded', handleLoad);
    window.addEventListener('google-maps-error', handleError);

    // Poll for API readiness
    const pollInterval = setInterval(() => {
      if (checkAPIStatus()) {
        clearInterval(pollInterval);
      }
    }, 100);

    // Timeout after 10 seconds
    timeoutId = window.setTimeout(() => {
      clearInterval(pollInterval);
      if (state.isChecking) {
        setState({ isLoaded: false, hasError: true, isChecking: false });
      }
    }, 10000);

    return () => {
      window.removeEventListener('google-maps-loaded', handleLoad);
      window.removeEventListener('google-maps-error', handleError);
      clearInterval(pollInterval);
      clearTimeout(timeoutId);
    };
  }, []);

  if (state.isChecking) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="flex flex-col items-center gap-2">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="text-sm text-muted-foreground">Loading Maps API...</p>
        </div>
      </div>
    );
  }

  if (state.hasError) {
    return (
      <Alert variant="destructive" className="m-4">
        <AlertCircle className="h-4 w-4" />
        <AlertTitle>API Error</AlertTitle>
        <AlertDescription>
          Failed to load Google Maps API. Please check your API key and try again.
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <APIContext.Provider value={{ isLoaded: state.isLoaded, hasError: state.hasError }}>
      {children}
    </APIContext.Provider>
  );
}