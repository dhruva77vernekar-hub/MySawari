import { AppError } from '../utils/app-error.js';
export async function queryOne(query,label='Database operation'){const {data,error}=await query; if(error)throw new AppError(400,'DATABASE_ERROR',`${label} failed: ${error.message}`);return data;}
export async function queryMany(query,label='Database operation'){const {data,error}=await query;if(error)throw new AppError(400,'DATABASE_ERROR',`${label} failed: ${error.message}`);return data||[];}
