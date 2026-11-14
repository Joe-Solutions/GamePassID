import { NextResponse } from "next/server";
import ExcelJS from "exceljs";
import fs from "fs";
import path from "path";
import { getCurrentEncoder } from "@/lib/auth";
import { getUploadsDir, listPlayers } from "@/lib/db";

function imageExtension(filename: string): "jpeg" | "png" | "gif" | null {
  const ext = path.extname(filename).toLowerCase();
  if (ext === ".jpg" || ext === ".jpeg") return "jpeg";
  if (ext === ".png") return "png";
  if (ext === ".gif") return "gif";
  return null;
}

export async function GET() {
  const encoder = await getCurrentEncoder();
  if (!encoder) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  try {
    const players = await listPlayers();
    const workbook = new ExcelJS.Workbook();
    workbook.creator = "Registration Hub";
    workbook.created = new Date();

    const sheet = workbook.addWorksheet("Players", {
      properties: { defaultRowHeight: 20 },
      views: [{ state: "frozen", ySplit: 1 }],
    });

    sheet.columns = [
      { header: "Player Name", key: "fullName", width: 28 },
      { header: "Mobile Number", key: "phone", width: 18 },
      { header: "Address", key: "address", width: 36 },
      { header: "Image", key: "image", width: 14 },
      { header: "Registered Date", key: "registeredDate", width: 22 },
    ];

    const headerRow = sheet.getRow(1);
    headerRow.font = { bold: true };
    headerRow.alignment = { vertical: "middle" };

    const uploadsDir = getUploadsDir();

    players.forEach((player, index) => {
      const rowNumber = index + 2;
      const registeredAt = new Date(player.createdAt);
      const registeredDate = Number.isNaN(registeredAt.getTime())
        ? player.createdAt
        : registeredAt.toLocaleString();

      const row = sheet.getRow(rowNumber);
      row.values = [
        player.fullName,
        player.phone || "",
        player.address || "",
        "",
        registeredDate,
      ];
      row.height = 72;
      row.alignment = { vertical: "middle", wrapText: true };

      if (player.photoPath) {
        const filePath = path.join(uploadsDir, player.photoPath);
        const extension = imageExtension(player.photoPath);
        if (extension && fs.existsSync(filePath)) {
          const imageId = workbook.addImage({
            buffer: fs.readFileSync(filePath) as unknown as ExcelJS.Buffer,
            extension,
          });
          sheet.addImage(imageId, {
            tl: { col: 3.15, row: rowNumber - 0.85 },
            ext: { width: 64, height: 64 },
            editAs: "oneCell",
          });
        }
      }
    });

    const buffer = await workbook.xlsx.writeBuffer();
    const stamp = new Date().toISOString().slice(0, 10);
    const filename = `registration-hub-players-${stamp}.xlsx`;

    return new NextResponse(Buffer.from(buffer), {
      status: 200,
      headers: {
        "Content-Type":
          "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        "Content-Disposition": `attachment; filename="${filename}"`,
        "Cache-Control": "no-store",
      },
    });
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { error: "Could not export player list." },
      { status: 500 },
    );
  }
}
