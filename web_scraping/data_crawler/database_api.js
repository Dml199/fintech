
import { PrismaClient } from '../generated/prisma/client/client.js';

import { PrismaPg } from '@prisma/adapter-pg';

const adapter = new PrismaPg({
  connectionString: "postgresql://postgres:12357111317dmK@localhost:5432/my_prisma_db",
});

const prisma = new PrismaClient({ adapter });


export class DbAPIHandler {
  static async findPost(postList) {
    console.log("before")
    console.log(postList)
    const existingTitles = await prisma.post.findMany({
      where: { 
        title: { in: postList.map(unit => unit.header) }
      },
      select: { title: true }
    });
    
    const existingSet = new Set(existingTitles.map(p => p.title));

    return postList.filter(unit => !existingSet.has(unit.header));
  }

  static async pushPost(postList) {

    await prisma.$transaction(
      postList.map(post => 
        prisma.post.create({
          data: {
            url:post.href,
            title: post.header,
            content: post.content,
          }
        })
      )
    );
  }
}