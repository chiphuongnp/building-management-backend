import { HOUR } from '../constants/constant';

export const getNormalizedDate = (input?: string | Date) => {
  const date = input ? new Date(input) : new Date();
  date.setHours(0, 0, 0, 0);
  return date;
};

export const getTomorrow = () => {
  const now = getNormalizedDate();
  return new Date(now.setDate(now.getDate() + 1));
};

export const getYesterday = () => {
  const now = getNormalizedDate();
  return new Date(now.setDate(now.getDate() - 1));
};

export const getDayOfWeek = (input: Date): string => {
  return input.toLocaleDateString('en-US', { weekday: 'long' }).toLowerCase();
};

export const calculateHoursDifference = (startTime: Date, endTime: Date): number => {
  return (startTime.getTime() - endTime.getTime()) / HOUR;
};
