'use server'

import { z } from 'zod'
import {
  verifyPassword,
  createSession,
  createUser,
  deleteSession,
} from '@/lib/auth'

import { mockDelay } from '@/lib/utils'
import { redirect } from 'next/navigation'
import { validateHeaderName } from 'http'
import { getUserByEmail } from '@/lib/dal'

// Define Zod schema for signin validation
const SignInSchema = z.object({
  email: z.string().min(1, 'Email is required').email('Invalid email format'),
  password: z.string().min(1, 'Password is required'),
})

// Define Zod schema for signup validation
const SignUpSchema = z
  .object({
    email: z.string().min(1, 'Email is required').email('Invalid email format'),
    password: z.string().min(6, 'Password must be at least 6 characters'),
    confirmPassword: z.string().min(1, 'Please confirm your password'),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords don't match",
    path: ['confirmPassword'],
  })

export type SignInData = z.infer<typeof SignInSchema>
export type SignUpData = z.infer<typeof SignUpSchema>

export type ActionResponse = {
  success: boolean
  message: string
  errors?: Record<string, string[]>
  error?: string
}


export const signIn = async (formData: FormData): Promise<ActionResponse> => {
  try {
    await mockDelay(500)

    const data = {
      email: formData.get('email') as string,
      password: formData.get('password') as string
    }

    const validationOutCome = SignInSchema.safeParse(data)

    if (!validationOutCome.success) {
      return {
        success: false,
        message: "Incorrect or missing field",
        errors: validationOutCome.error.flatten().fieldErrors
      }
    }

    const user = await getUserByEmail(data.email);

    if (!user) {
      return {
        success: false,
        message: "Invalid email or password",
        errors: {
          email: ['Invalid email or password']
        }
      }
    }

    const isPasswordValid = await verifyPassword(data.password, user.password)


    if (!isPasswordValid) {
      return {
        success: false,
        message: "Invalid email or password",
        errors: {
          email: ['Invalid email or password']
        }
      }
    }


    await createSession(user.id)

    return {
      success: true,
      message: "Signed in successfully"
    }
  }
  catch (e) {
    console.error(e)
    return {
      success: false,
      message: 'Sign in failed',
      error: "Sign in failed"
    }
  }
}


export const signUp = async (formData: FormData): Promise<ActionResponse> => {


  try {
    await mockDelay(500)

    const data = {
      email: formData.get('email') as string,
      password: formData.get('password') as string,
      confirmPassword: formData.get('confirmPassword') as string
    }

    const validationResult = SignUpSchema.safeParse(data)

    if (!validationResult.success) {
      return {
        success: false,
        message: "Validation Failed",
        errors: validationResult.error.flatten().fieldErrors
      }
    }


    const isExistingUser = await getUserByEmail(data.email)

    if (isExistingUser) {
      return {
        success: false, message: "User already exists", errors: {
          email: ["This email has already been used"]
        }
      }
    }

    const newUser = await createUser(data.email, data.password)

    if (!newUser) {
      throw new Error('failed to create a new user')
    }


    await createSession(newUser.id)

    return {
      success: true,
      message: "User has been successfully created"
    }
  }
  catch (e) {
    console.error(e)
    return {
      success: false,
      message: 'Failed to signup',
      error: "Failed to signup"
    }
  }

}


export const signOut = async (): Promise<ActionResponse> => {

  try {
    mockDelay(500)
    deleteSession()
    return {
      success: true,
      message: 'Logged out sucessfully'
    }
  }
  catch (e) {
    console.error(e)
    return {
      success: false,
      message: "Failed to signout"
    }
  }
  finally {
    redirect('/signin')
  }

}