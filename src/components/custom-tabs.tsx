"use client";

import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface TabsProps {
  items: { [key: string]: string };
  onTabChange: (value: string) => void;
  defaultValue?: string;
}

export function CustomTabs({ items, onTabChange, defaultValue }: TabsProps) {
  // Function to format the tab value (lowercase and replace spaces with underscore)
  const formatTabValue = (key: string): string => {
    return key.toLowerCase().replace(/\s+/g, "_");
  };

  // Handle tab change
  const handleValueChange = (tabValue: string) => {
    // Find the original key that corresponds to this formatted value
    const originalKey = Object.keys(items).find(
      (key) => formatTabValue(key) === tabValue
    );

    if (originalKey) {
      onTabChange(items[originalKey]);
    }
  };

  // Get the first formatted key for default value if none provided
  const firstKey = Object.keys(items)[0];
  const defaultTab = defaultValue || (firstKey ? formatTabValue(firstKey) : "");

  return (
    <Tabs defaultValue={defaultTab} onValueChange={handleValueChange}>
      <TabsList>
        {Object.keys(items).map((key) => (
          <TabsTrigger key={key} value={formatTabValue(key)}>
            {key}
          </TabsTrigger>
        ))}
      </TabsList>
    </Tabs>
  );
}
