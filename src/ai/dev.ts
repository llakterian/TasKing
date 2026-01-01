'use server';
/**
 * @fileOverview A dev server for Genkit.
 *
 * This file is not intended to be used in production.
 */

import {config} from 'dotenv';
config();

import '@/ai/flows/summarize-project.ts';
import '@/ai/flows/recommend-assignee.ts';
import '@/ai/flows/generate-task-description.ts';
import '@/ai/flows/verify-evm-wallet.ts';
