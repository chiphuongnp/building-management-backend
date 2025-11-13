export const getNormalizedDate = (input?: string | Date) => {
  const date = input ? new Date(input) : new Date();
  date.setHours(0, 0, 0, 0);
  return date;
};

export const getTomorrow = () => {
  const now = getNormalizedDate();
  return now.setDate(now.getDate() + 1);
};

export const getDayOfWeek = (input: Date): string => {
  return input.toLocaleDateString('en-US', { weekday: 'long' }).toLowerCase();
};
