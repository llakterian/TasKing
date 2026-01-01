'use server';

/**
 * @fileOverview An AI agent that summarizes the current status of a project.
 *
 * - summarizeProject - A function that generates a summary of a project's current status.
 * - SummarizeProjectInput - The input type for the summarizeProject function.
 * - SummarizeProjectOutput - The return type for the summarizeProject function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const SummarizeProjectInputSchema = z.object({
  projectName: z.string().describe('The name of the project to summarize.'),
  completedTasks: z.array(z.string()).describe('A list of completed tasks in the project.'),
  ongoingTasks: z.array(z.string()).describe('A list of tasks currently in progress in the project.'),
  potentialRisks: z.array(z.string()).describe('A list of potential risks identified for the project.'),
});
export type SummarizeProjectInput = z.infer<typeof SummarizeProjectInputSchema>;

const SummarizeProjectOutputSchema = z.object({
  summary: z.string().describe('A summary of the project status, including completed tasks, ongoing tasks, and potential risks.'),
});
export type SummarizeProjectOutput = z.infer<typeof SummarizeProjectOutputSchema>;

export async function summarizeProject(input: SummarizeProjectInput): Promise<SummarizeProjectOutput> {
  return summarizeProjectFlow(input);
}

const prompt = ai.definePrompt({
  name: 'summarizeProjectPrompt',
  input: {schema: SummarizeProjectInputSchema},
  output: {schema: SummarizeProjectOutputSchema},
  prompt: `You are a project management expert. Please provide a concise summary of the current project status based on the following information:\n\nProject Name: {{{projectName}}}\nCompleted Tasks:\n{{#each completedTasks}}- {{{this}}}\n{{/each}}\nOngoing Tasks:\n{{#each ongoingTasks}}- {{{this}}}\n{{/each}}\nPotential Risks:\n{{#each potentialRisks}}- {{{this}}}\n{{/each}}\n\nSummary: `,
});

const summarizeProjectFlow = ai.defineFlow(
  {
    name: 'summarizeProjectFlow',
    inputSchema: SummarizeProjectInputSchema,
    outputSchema: SummarizeProjectOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
