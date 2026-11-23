import data from './reference-profile.json';
import { referenceProfileSchema } from './profile-schema';
export { referenceProfileSchema } from './profile-schema';
export const referenceProfile = referenceProfileSchema.parse(data);
export function referenceValue(id: string): number {
  const parameter = referenceProfile.params[id as keyof typeof referenceProfile.params];
  if (!parameter) throw new Error(`Unknown reference parameter: ${id}`);
  return parameter.value;
}
