---
name: create_component
description: Generate a standard React Functional Component with TypeScript and Tailwind CSS.
---

# Create Component Skill

This skill generates a React component file with the following standards:
- **Framework**: React (Functional Component)
- **Language**: TypeScript (`.tsx`)
- **Styling**: Tailwind CSS
- **Icons**: `lucide-react` (if needed)
- **Props**: Defined via `interface`

## Instructions

1.  **Input**:
    - Component Name (e.g., `MyCard`)
    - Props (optional)
    - Purpose/Functionality

2.  **Output Template**:

```tsx
import React from 'react';
import { LucideIcon } from 'lucide-react'; // Import specific icons as needed

interface MyCardProps {
  title: string;
  icon?: LucideIcon;
  className?: string;
  onClick?: () => void;
}

const MyCard: React.FC<MyCardProps> = ({ 
  title, 
  icon: Icon, 
  className = '', 
  onClick 
}) => {
  return (
    <div 
      onClick={onClick}
      className={`bg-white rounded-xl p-4 shadow-sm border border-gray-100 hover:shadow-md transition-all ${className}`}
    >
      <div className="flex items-center gap-2">
        {Icon && <Icon size={20} className="text-gray-500" />}
        <h3 className="font-bold text-gray-800">{title}</h3>
      </div>
      {/* Content goes here */}
    </div>
  );
};

export default MyCard;
```

3.  **Style Guide Adherence**:
    - Use `rounded-xl` or `rounded-3xl` for containers.
    - Use `font-black` for headers, `font-bold` for important text.
    - Default text color: `text-gray-800` or `text-gray-700`.
    - Default border color: `border-gray-100`.
