import { useState } from "react";
import { Button } from "@/components/ui/button";

export function ExpandableDescription({ description }: { description: string }) {
  const [expanded, setExpanded] = useState(false);
  const toggle = () => setExpanded((prev) => !prev);

  const truncateDescription = (description: string, maxLength: number = 100) => {
    return description.length > maxLength ? description.substring(0, maxLength) + '...' : description;
  };

  return (
    <div>
      {expanded ? description : truncateDescription(description)}
      {/* only show the button if the text is too large */}
      {description.length > 100 && (
        <Button onClick={toggle} variant="link" className="text-blue-500">
          {expanded ? "Show Less" : "Show More"}
        </Button>
      )}
    </div>
  );
}