# Colors & Typography

## Device Geometry

| Parameter | Value |
|---|---|
| Target device | iPhone 17 Pro (mockup) |
| Screen width | 390px |
| Screen height | 844px |
| Outer frame border radius | rounded-[50px] |
| Inner screen border radius | rounded-[40px] |
| Safe area top | pt-[60px] |
| Safe area bottom | pb-[34px] |
| Horizontal padding | px-5 (20px) |

## Typography

**Font:** Jost — loaded via Google Fonts

| Role | Tailwind | px | Weight |
|---|---|---|---|
| Heading | `text-[36px]` | 36px | `font-bold` |
| Title | `text-[20px]` | 20px | `font-semibold` |
| Body | `text-[14px]` | 14px | `font-normal` |
| Caption | `text-[12px]` | 12px | `font-normal` |

## Color Palette

| Name | HEX | Tailwind Token | Usage |
|---|---|---|---|
| Primary | `#8966FA` | `primary` | Buttons, active icons, accents |
| Primary Light | `#D2C5FF` | `primary-light` | Card backgrounds, section fills |
| Primary Pale | `#E4DEF9` | `primary-pale` | Lighter purple fills |
| Auth Background | `#EDE8FF` | `auth-bg` | Auth screen background |
| Secondary | `#FFE100` | `secondary` | Active highlights |
| Yellow Pastel | `#FFF9B2` | `yellow-pastel` | Meal Plan cards |
| Green Pastel | `#E1FFB0` | `green-pastel` | Lunch/Dinner cards |
| Green Light | `#CBFFCF` | `green-light` | Alternative green fills |
| Orange Pastel | `#FFDE96` | `orange-pastel` | Shopping list widget |
| Orange Light | `#FFD9C1` | `orange-light` | Alternative orange fills |
| Black | `#0A0116` | `app-black` | Main text, dark backgrounds |
| White | `#FFFFFF` | `white` | Card backgrounds |
| Background | `#F5F5F8` | `app-bg` | Screen background |
| Muted Text | `#6B7280` | `gray-500` | Secondary text, labels |

### Tailwind Config

```js
colors: {
  primary: '#8966FA',
  'primary-light': '#D2C5FF',
  'primary-pale': '#E4DEF9',
  'auth-bg': '#EDE8FF',
  secondary: '#FFE100',
  'yellow-pastel': '#FFF9B2',
  'green-pastel': '#E1FFB0',
  'green-light': '#CBFFCF',
  'app-black': '#0A0116',
  'app-bg': '#F5F5F8',
  'gray-500': '#6B7280',
  'orange-pastel': '#FFDE96',
  'orange-light': '#FFD9C1',
  white: '#FFFFFF',
}
```
