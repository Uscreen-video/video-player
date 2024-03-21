const pad = (num: number, size: number) => `000${num}`.slice(size * -1);

export const timeAsString = (timeInSeconds: number) => {
  const time = Math.abs(
    Number((isNaN(timeInSeconds) ? 0 : timeInSeconds).toFixed(3)),
  );
  const hours = Math.floor(time / 60 / 60);
  const minutes = Math.floor(time / 60) % 60;
  const seconds = Math.floor(time - minutes * 60);

  return hours > 0
    ? `${pad(hours, 2)}:${pad(minutes, 2)}:${pad(seconds, 2)}`
    : `${pad(minutes, 2)}:${pad(seconds, 2)}`;
};
