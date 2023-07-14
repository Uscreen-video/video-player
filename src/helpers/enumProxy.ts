export const enumProxy = (type: Record<string | number, number | string>) => new Proxy(type, {
  get: (_, propertyKey: string) => type[propertyKey]
}) 
