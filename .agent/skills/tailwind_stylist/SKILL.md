---
name: tailwind_stylist
description: Apply consistent "Taiwanese Anime Sticker Maker" theme styles using Tailwind CSS.
---

# Tailwind Stylist Skill

This skill ensures that all UI elements follow the project's specific color palette and design language.

## Color Palette

| Usage | Color Name | Hex Code | Tailwind Class |
| :--- | :--- | :--- | :--- |
| **Global Background** | Light Cyan | `#D1E9E9` | `bg-[#D1E9E9]` |
| **Header/Footer Bg** | Deep Teal | `#285E61` | `bg-[#285E61]` |
| **Header/Footer Text** | Light Beige | `#F7FAFC` | `text-[#F7FAFC]` |
| **Primary Button** | Coral Red | `#E53E3E` | `bg-[#E53E3E]` |
| **Primary Btn Hover** | Darker Red | `#c53030` | `hover:bg-[#c53030]` |
| **Secondary Accent** | Green | `green-500` | `text-green-500`, `bg-green-50` |
| **Text (Body)** | Gray 800 | `gray-800` | `text-gray-800` |

## Design Rules

1.  **Buttons**:
    - Always use `rounded-full` or `rounded-3xl` for a soft, friendly look.
    - Add `shadow-md` or `shadow-lg` for depth.
    - Interactive elements should have `transition-all` and `active:scale-95`.

2.  **Cards / Containers**:
    - Use `bg-white rounded-3xl`.
    - Apply `shadow-xl` for main sections.
    - Border: `border-2 border-gray-100` (or colored border for active states).

3.  **Typography**:
    - Headings: `font-black` (Extra Bold).
    - Body: `font-medium` or `font-bold` (We prefer bold text for this playful app).

4.  **Special Elements**:
    - **Tags/Badges**: Use pastel backgrounds with darker text (e.g., `bg-blue-100 text-blue-600`).
