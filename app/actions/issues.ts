'use server'

import { db } from '@/db'
import { issues } from '@/db/schema'
import { and, eq } from 'drizzle-orm'
import { getCurrentUser } from '@/lib/dal'
import { z } from 'zod'
import { mockDelay } from '@/lib/utils'
import { revalidateTag } from 'next/cache'

// Define Zod schema for issue validation
const IssueSchema = z.object({
  title: z
    .string()
    .min(3, 'Title must be at least 3 characters')
    .max(100, 'Title must be less than 100 characters'),

  description: z.string().optional().nullable(),

  status: z.enum(['backlog', 'todo', 'in_progress', 'done'], {
    errorMap: () => ({ message: 'Please select a valid status' }),
  }),

  priority: z.enum(['low', 'medium', 'high'], {
    errorMap: () => ({ message: 'Please select a valid priority' }),
  }),
  userId: z.string().min(1, 'User ID is required'),
})

export type IssueData = z.infer<typeof IssueSchema>

export type ActionResponse = {
  success: boolean
  message: string
  errors?: Record<string, string[]>
  error?: string
}


export async function createIssue(data: IssueData): Promise<ActionResponse> {
  try {
    // Security check - ensure user is authenticated
    const user = await getCurrentUser()

    if (!user) {
      return {
        success: false,
        message: 'Unauthorized access',
        error: 'Unauthorized',
      }
    }

    // Validate with Zod
    const validationResult = IssueSchema.safeParse(data)
    if (!validationResult.success) {
      return {
        success: false,
        message: 'Validation failed',
        errors: validationResult.error.flatten().fieldErrors,
      }
    }

    // Create issue with validated data
    const validatedData = validationResult.data
    await db.insert(issues).values({
      title: validatedData.title,
      description: validatedData.description || null,
      status: validatedData.status,
      priority: validatedData.priority,
      userId: validatedData.userId,
    })

    // revalidate cache

    revalidateTag('issues')

    return { success: true, message: 'Issue created successfully' }
  } catch (error) {
    console.error('Error creating issue:', error)
    return {
      success: false,
      message: 'An error occurred while creating the issue',
      error: 'Failed to create issue',
    }
  }
}

export async function updateIssue(
  id: number,
  data: Partial<IssueData>
): Promise<ActionResponse> {

  try {
    const user = await getCurrentUser()

    if (!user) {
      return {
        success: false,
        message: "Unauthorized access",
        error: "UnAuthorized"
      }
    }

    const UpdateIssueSchema = IssueSchema.partial();

    const validationResult = UpdateIssueSchema.safeParse(data)

    if (!validationResult.success) {
      return {
        success: false,
        message: "Invalid inputs",
        errors: validationResult.error.flatten().fieldErrors
      }
    }

    const validatedData = validationResult.data
    const updateData: Record<string, unknown> = {}

    if (validatedData.title !== undefined)
      updateData.title = validatedData.title
    if (validatedData.description !== undefined)
      updateData.description = validatedData.description
    if (validatedData.status !== undefined)
      updateData.status = validatedData.status
    if (validatedData.priority !== undefined)
      updateData.priority = validatedData.priority

    // Update issue
    await db.update(issues).set(updateData).where(eq(issues.id, id))

    return { success: true, message: 'Issue updated successfully' }

  }
  catch (e) {
    console.error((e as Error).message || 'Unkown error occured with updating issue')
    return { success: false, message: "Failed to update issue", error: "Failed to update issue" }
  }
}

export async function deleteIssue(id: number): Promise<ActionResponse> {
  try {
    await mockDelay(700)
    const user = await getCurrentUser()

    if (!user) {
      return { success: false, message: "Unauthorized access" }
    }

    const issueToBeDeleted = await db.delete(issues).where(and(eq(issues.id, id), eq(issues.userId, user.id)))


    return {
      success: true,
      message: `Deleted issue with id of ${id} successfully`
    }
  }
  catch (e) {

    const errorMessage = (e as Error).message || 'Unknown error occured with deleting issue'

    console.error(errorMessage)

    return {
      success: false,
      message: "Failed to delete issue",
      error: errorMessage
    }
  }

}