'use server';

/**
 * @fileOverview A task description generator AI agent.
 *
 * - generateTaskDescription - A function that generates a task description from a task title.
 * - GenerateTaskDescriptionInput - The input type for the generateTaskDescription function.
 * - GenerateTaskDescriptionOutput - The return type for the generateTaskDescription function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const GenerateTaskDescriptionInputSchema = z.object({
  taskTitle: z.string().describe('The title of the task.'),
});
export type GenerateTaskDescriptionInput = z.infer<typeof GenerateTaskDescriptionInputSchema>;

const GenerateTaskDescriptionOutputSchema = z.object({
  taskDescription: z.string().describe('The generated description of the task.'),
});
export type GenerateTaskDescriptionOutput = z.infer<typeof GenerateTaskDescriptionOutputSchema>;

export async function generateTaskDescription(input: GenerateTaskDescriptionInput): Promise<GenerateTaskDescriptionOutput> {
  return generateTaskDescriptionFlow(input);
}

const prompt = ai.definePrompt({
  name: 'generateTaskDescriptionPrompt',
  input: {schema: GenerateTaskDescriptionInputSchema},
  output: {schema: GenerateTaskDescriptionOutputSchema},
  prompt: `You are an AI assistant that generates task descriptions based on task titles.

  Generate a detailed and comprehensive task description for the following task title:
  Task Title: {{{taskTitle}}}
  `,
});

const generateTaskDescriptionFlow = ai.defineFlow(
  {
    name: 'generateTaskDescriptionFlow',
    inputSchema: GenerateTaskDescriptionInputSchema,
    outputSchema: GenerateTaskDescriptionOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
