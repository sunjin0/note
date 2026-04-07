// @ts-ignore
import { Solar, Lunar } from 'lunar-javascript';

export function getLunarDate(date: Date | string): string {
  try {
    const dateObj = typeof date === 'string' ? new Date(date + 'T00:00:00') : date;
    const solar = Solar.fromDate(dateObj);
    const lunar = solar.getLunar();

    const lunarDay = lunar.getDayInChinese();
    const lunarMonth = lunar.getMonthInChinese();

    if (lunarDay === '初一') {
      return `${lunarMonth}月`;
    }

    const festivals = lunar.getFestivals();
    if (festivals.length > 0) {
      return festivals[0];
    }

    const jieQi = lunar.getJieQi();
    if (jieQi) {
      return jieQi;
    }

    return lunarDay;
  } catch (error) {
    return '';
  }
}

export function isLunarFestival(date: Date | string): boolean {
  try {
    const dateObj = typeof date === 'string' ? new Date(date + 'T00:00:00') : date;
    const solar = Solar.fromDate(dateObj);
    const lunar = solar.getLunar();

    return lunar.getFestivals().length > 0 || lunar.getJieQi() !== null;
  } catch {
    return false;
  }
}
