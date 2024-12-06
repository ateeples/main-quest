import { useState, useRef, useEffect } from 'react';
import { ChevronDown, ChevronRight } from 'lucide-react';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
import { Checkbox } from '@/components/ui/checkbox';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { BUSINESS_TYPE_HIERARCHY } from '@/lib/constants';

interface BusinessTypeSelectorProps {
  onSelectionChange: (selectedTypes: string[]) => void;
}

export function BusinessTypeSelector({ onSelectionChange }: BusinessTypeSelectorProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [expandedCategory, setExpandedCategory] = useState<string | null>(null);
  const [selectedTypes, setSelectedTypes] = useState<string[]>([]);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const toggleCategory = (category: string) => {
    setExpandedCategory(current => current === category ? null : category);
  };

  const handleTypeChange = (type: string, checked: boolean) => {
    const newSelectedTypes = checked
      ? [...selectedTypes, type]
      : selectedTypes.filter(t => t !== type);
    
    setSelectedTypes(newSelectedTypes);
    onSelectionChange(newSelectedTypes);
  };

  const clearSelection = () => {
    setSelectedTypes([]);
    onSelectionChange([]);
  };

  return (
    <div ref={containerRef}>
      <Collapsible
        open={isOpen}
        onOpenChange={setIsOpen}
        className="w-full space-y-2 bg-white rounded-lg shadow-sm border p-2"
      >
        <div className="flex items-center justify-between">
          <CollapsibleTrigger asChild>
            <Button variant="ghost" size="sm" className="w-full justify-between px-4">
              <span>Find nearby competitors</span>
              {isOpen ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
            </Button>
          </CollapsibleTrigger>
        </div>

        <CollapsibleContent>
          <ScrollArea className="h-[300px] pr-4">
            <div className="space-y-4 p-2">
              {Object.entries(BUSINESS_TYPE_HIERARCHY).map(([category, subcategories]) => (
                <div key={category} className="space-y-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="w-full justify-between p-2 font-semibold"
                    onClick={() => toggleCategory(category)}
                  >
                    {category}
                    {expandedCategory === category ? (
                      <ChevronDown className="h-4 w-4" />
                    ) : (
                      <ChevronRight className="h-4 w-4" />
                    )}
                  </Button>

                  {expandedCategory === category && (
                    <div className="ml-4 space-y-4">
                      {Object.entries(subcategories).map(([subCategory, types]) => (
                        <div key={subCategory} className="space-y-2">
                          {Array.isArray(types) ? (
                            <div className="space-y-2">
                              <div className="font-medium text-sm">{subCategory}</div>
                              <div className="ml-4 grid grid-cols-2 gap-2">
                                {types.map((type) => (
                                  <div key={type} className="flex items-center space-x-2">
                                    <Checkbox
                                      id={type}
                                      checked={selectedTypes.includes(type)}
                                      onCheckedChange={(checked) => 
                                        handleTypeChange(type, checked === true)
                                      }
                                    />
                                    <label
                                      htmlFor={type}
                                      className="text-sm leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                                    >
                                      {type.split('_').map(word => 
                                        word.charAt(0).toUpperCase() + word.slice(1)
                                      ).join(' ')}
                                    </label>
                                  </div>
                                ))}
                              </div>
                            </div>
                          ) : (
                            // Rest of your existing render logic for non-array types
                            <div className="space-y-2">
                              <div className="font-medium text-sm">{subCategory}</div>
                              {Object.entries(types).map(([name, subtypes]) => (
                                <div key={name} className="ml-4 space-y-2">
                                  {Array.isArray(subtypes) && subtypes.map((type) => (
                                    <div key={type} className="flex items-center space-x-2">
                                      <Checkbox
                                        id={type}
                                        checked={selectedTypes.includes(type)}
                                        onCheckedChange={(checked) => 
                                          handleTypeChange(type, checked === true)
                                        }
                                      />
                                      <label
                                        htmlFor={type}
                                        className="text-sm leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                                      >
                                        {type.split('_').map(word => 
                                          word.charAt(0).toUpperCase() + word.slice(1)
                                        ).join(' ')}
                                      </label>
                                    </div>
                                  ))}
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </ScrollArea>
          
          <div className="flex justify-end pt-4">
            <Button
              variant="destructive"
              size="sm"
              onClick={clearSelection}
              className="text-sm px-4"
            >
              Clear Selection
            </Button>
          </div>
        </CollapsibleContent>
      </Collapsible>
    </div>
  );
}