import { NextResponse } from "next/server";
import { z } from "zod";
import {
  findPlayerByNameAndBirthdate,
  getPlayerByLicenseId,
} from "@/lib/db";

const lookupSchema = z.union([
  z.object({
    licenseId: z.string().trim().min(3).max(40),
  }),
  z.object({
    fullName: z.string().trim().min(2).max(120),
    birthdate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  }),
]);

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const parsed = lookupSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Enter a license ID, or your full name and birthdate." },
        { status: 400 },
      );
    }

    const player =
      "licenseId" in parsed.data
        ? await getPlayerByLicenseId(parsed.data.licenseId)
        : await findPlayerByNameAndBirthdate(
            parsed.data.fullName,
            parsed.data.birthdate,
          );

    if (!player) {
      return NextResponse.json(
        { error: "No registered player matched those details." },
        { status: 404 },
      );
    }

    return NextResponse.json({ player });
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { error: "Could not look up license." },
      { status: 500 },
    );
  }
}
