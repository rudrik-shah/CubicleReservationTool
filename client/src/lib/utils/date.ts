import { format, addDays, parseISO } from 'date-fns';

export const formatDateToISO = (date: Date): string => {
  return format(date, 'yyyy-MM-dd');
};

export const formatDateToDisplay = (date: Date | string): string => {
  const dateObj = typeof date === 'string' ? parseISO(date) : date;
  return format(dateObj, 'MMMM dd, yyyy');
};

export const formatDateShort = (date: Date | string): string => {
  const dateObj = typeof date === 'string' ? parseISO(date) : date;
  return format(dateObj, 'MMM dd, yyyy');
};

export const getToday = (): Date => {
  return new Date();
};

export const getTodayISO = (): string => {
  return formatDateToISO(getToday());
};

export const getTomorrow = (): Date => {
  return addDays(getToday(), 1);
};

export const getTomorrowISO = (): string => {
  return formatDateToISO(getTomorrow());
};
