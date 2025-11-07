export const getNormalizedDate = (input?: string | Date) => {
  const date = input ? new Date(input) : new Date();
  date.setHours(0, 0, 0, 0);
  return date;
};

export const getTomorrow = () => {
  const tomorrow = getNormalizedDate();
  tomorrow.setDate(tomorrow.getDate() + 1);
  return tomorrow;
};
