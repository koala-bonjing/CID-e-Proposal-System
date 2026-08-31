import { NextRequest, NextResponse } from "next/server";
import { getAllUsers, addUser } from "@/lib/store";
import type { User } from "@/types";

export async function GET() {
  return NextResponse.json(getAllUsers());
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  const user: User = {
    id: `u-${crypto.randomUUID().slice(0, 8)}`,
    name: body.name,
    role: body.role,
    school: body.school,
    district: body.district,
    programArea: body.programArea,
  };
  addUser(user);
  return NextResponse.json(user, { status: 201 });
}
