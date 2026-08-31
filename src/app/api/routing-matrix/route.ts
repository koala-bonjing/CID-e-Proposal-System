import { NextRequest, NextResponse } from "next/server";
import { getRoutingMatrix, setRoutingMatrix } from "@/lib/store";
import type { RoutingMatrixEntry } from "@/types";

export async function GET() {
  return NextResponse.json(getRoutingMatrix());
}

export async function PUT(req: NextRequest) {
  const entries: RoutingMatrixEntry[] = await req.json();
  setRoutingMatrix(entries);
  return NextResponse.json(getRoutingMatrix());
}
