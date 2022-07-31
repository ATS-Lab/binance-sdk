export function getNumberPrecision(value: number): number {
    const valueString = value.toString();
    if (valueString.includes('.')) {
        return valueString.length - (valueString.indexOf('.') + 1);
    } else {
        return 0;
    }
}
