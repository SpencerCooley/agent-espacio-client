export { hackerBuzzTheme, hackerBuzzDarkTheme } from './hackerBuzz';
export { midnightGlowTheme, midnightGlowDarkTheme } from './midnightGlow';
export { playfulCandyTheme, playfulCandyDarkTheme } from './playfulCandy';
export { luxeartTheme, luxeartDarkTheme } from './luxeart';
export { retroGamifyTheme, retroGamifyDarkTheme } from './retroGamify';
export { scientificAcademiaTheme, scientificAcademiaDarkTheme } from './scientificAcademia';
export { mintCreamTheme, mintCreamDarkTheme } from './mintCreamTheme';

import { ThemeOptions } from '@mui/material/styles';
import { hackerBuzzTheme, hackerBuzzDarkTheme } from './hackerBuzz';
import { midnightGlowTheme, midnightGlowDarkTheme } from './midnightGlow';
import { playfulCandyTheme, playfulCandyDarkTheme } from './playfulCandy';
import { luxeartTheme, luxeartDarkTheme } from './luxeart';
import { retroGamifyTheme, retroGamifyDarkTheme } from './retroGamify';
import { scientificAcademiaTheme, scientificAcademiaDarkTheme } from './scientificAcademia';
import { mintCreamTheme, mintCreamDarkTheme } from './mintCreamTheme';

export const themeMap: Record<string, { light: ThemeOptions; dark: ThemeOptions }> = {
  hackerBuzz: { light: hackerBuzzTheme, dark: hackerBuzzDarkTheme },
  midnightGlow: { light: midnightGlowTheme, dark: midnightGlowDarkTheme },
  playfulCandy: { light: playfulCandyTheme, dark: playfulCandyDarkTheme },
  luxeart: { light: luxeartTheme, dark: luxeartDarkTheme },
  retroGamify: { light: retroGamifyTheme, dark: retroGamifyDarkTheme },
  scientificAcademia: { light: scientificAcademiaTheme, dark: scientificAcademiaDarkTheme },
  mintCream: { light: mintCreamTheme, dark: mintCreamDarkTheme },
};
