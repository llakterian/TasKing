'use server';

/**
 * @fileOverview This file defines a Genkit flow to recommend the best assignee for a task.
 *
 * The flow takes a task description, skill requirements, and project details as input, and
 * recommends an assignee based on their skills, availability, and past performance.
 *
 * - recommendAssignee - The main function that triggers the assignee recommendation process.
 * - RecommendAssigneeInput - The input type for the recommendAssignee function.
 * - RecommendAssigneeOutput - The return type for the recommendAssignee function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const RecommendAssigneeInputSchema = z.object({
  taskDescription: z.string().describe('A detailed description of the task.'),
  requiredSkills: z.array(z.string()).describe('An array of skills required for the task.'),
  projectDetails: z.string().describe('Details about the project the task belongs to.'),
  taskDueDate: z.string().describe('The due date for the task (YYYY-MM-DD).'),
});

export type RecommendAssigneeInput = z.infer<typeof RecommendAssigneeInputSchema>;

const RecommendAssigneeOutputSchema = z.object({
  recommendedAssignee: z.string().describe('The name or ID of the recommended assignee.'),
  reason: z.string().describe('The reason for recommending this assignee.'),
});

export type RecommendAssigneeOutput = z.infer<typeof RecommendAssigneeOutputSchema>;

export async function recommendAssignee(input: RecommendAssigneeInput): Promise<RecommendAssigneeOutput> {
  return recommendAssigneeFlow(input);
}

const recommendAssigneePrompt = ai.definePrompt({
  name: 'recommendAssigneePrompt',
  input: {schema: RecommendAssigneeInputSchema},
  output: {schema: RecommendAssigneeOutputSchema},
  prompt: `You are an AI assistant helping project managers assign tasks to the best-suited team member.

  Given the following task description, required skills, project details, and task due date, recommend the best assignee from the team.
  Consider their skills, availability, and past performance on similar tasks. Explain the reasoning for your recommendation.

  Task Description: {{{taskDescription}}}
  Required Skills: {{#each requiredSkills}}{{{this}}}{{#unless @last}}, {{/unless}}{{/each}}
  Project Details: {{{projectDetails}}}
  Task Due Date: {{{taskDueDate}}}
  
  Format your response as a JSON object with "recommendedAssignee" and "reason" fields.
  `,
});

const recommendAssigneeFlow = ai.defineFlow(
  {
    name: 'recommendAssigneeFlow',
    inputSchema: RecommendAssigneeInputSchema,
    outputSchema: RecommendAssigneeOutputSchema,
  },
  async input => {
    const {output} = await recommendAssigneePrompt(input);
    return output!;
  }
);
