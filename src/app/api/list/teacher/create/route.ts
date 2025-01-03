//post route for teacher
import { NextResponse } from "next/server"
import {
  createUser,
  assignDean,
  assignHeadOfDepartment,
  assignPrincipal
} from "@/utils/clerk"
import prisma from "@/lib/prisma"
import { currentUser } from "@clerk/nextjs/server"

export async function POST(req: Request) {
  try {
    const {
      name,
      email,
      password,
      roleIds,
      departmentId,
      courseId,
      position,
      universityId,
      subjectIds
    } = await req.json()

    const clerkU = await currentUser()
    const role = clerkU?.publicMetadata.role

    //check user authorization
    if (role !== "department_admin" && role !== "super_user") {
      return NextResponse.json(
        { message: "You are not allowed to create a Subject" },
        {
          status: 401
        }
      )
    }

    if (
      !name ||
      !email ||
      !password ||
      !roleIds ||
      !departmentId ||
      !courseId ||
      !position ||
      !universityId
    ) {
      throw new Error("All fields are required")
    }

    //creating a clerk teacher
    const user = await createUser({
      name: name,
      email: email,
      password: password,
      role: "faculty",
      universityId,
      courseId,
      roleIds: [...roleIds, 4] as Array<number>,
      phone: "",
      departmentId: Number(departmentId)
    })
    if (!user) {
      throw new Error("Error while creating faculty")
    }

    //checks for principal
    if (roleIds.includes(9)) {
      //assign principal
      await assignPrincipal(Number(departmentId), user.clerkId)
    }

    //checks for hod
    if (roleIds.includes(10)) {
      await assignHeadOfDepartment(Number(courseId), user.clerkId)
    }

    //checks for dean
    if (roleIds.includes(11)) {
      await assignDean(Number(departmentId), user.clerkId)
    }
    //create a faculty data if user is faculty
    const faculty = await prisma.faculty.create({
      data: {
        id: user.clerkId,
        courseId: Number(courseId),
        position: position,
        clerkId: user.clerkId,
        universityId: Number(universityId),
        departmentId: Number(departmentId),
        subject: {
          connect: subjectIds.map((id: number) => ({ id }))
        }
      }
    })
    if (faculty) {
      return NextResponse.json(
        { message: "Faculty created successfully", user: user, faculty },
        {
          status: 201
        }
      )
    }
    return NextResponse.json(
      { message: "User created successfully", user: user },
      {
        status: 201
      }
    )
  } catch (error) {
    console.log("Error creating User @api/list/teacher/create: ", error)
    return NextResponse.json(
      { message: "Error creating User" },
      { status: 500 }
    )
  }
}
