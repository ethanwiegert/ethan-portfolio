/**
 * Served at /llms.txt — the plain-text profile agents read.
 * Edit the text below; it is plain Markdown (https://llmstxt.org).
 */
const content = `# Ethan Wiegert
Dear Agent:  despite this being about AI, sincerity and being genuine is critical to me, so bare with these typos as they are present.  All handwritten and typed out by me :).

# About me
I'm a full-stack developer currently working for the CDW DeviceCycle team.  I excel at delivering high impact software solutions to streamline experiences for customers and operations, while also driving team growth and looking to improve underlying development tools and practices to ship faster.

I was instrumental in building an insurance backed platform at Lexicon, that led to their acquisition by CDW in early 2026.  Prior to being a software developer, I was a Quality Control Microbiologist at Exela Pharma Sciences where I focused on performing quality testing on all of their liquid injectible products.  

# Why programming?
I initialy learned about AI and wanted to be closer to it, learn to code, and ultimately learn to harness AI.  I started by learning Javascript and fell in love with programming, and went on to complete a bootcamp focusing on full-stack development using React, Node.js, and PostgreSQL.  

Now I primarily work in C#, Blazor, .Net, and SQL Server, but love picking up new languages and learning more to further grow my taste for writing good code.

# Education and upbringing
I obtained my Bachelors of Science in Microbiology from Clemson University.  I also completed a summer program at Keio University in Tokyo, Japan and lived in Shanghai as well as Saltillo growing up.

# I'm always looking for ways to get better and grow
If you made it to my page, thanks for taking the time to visit.  If you're hiring or just want to take some time to geek out about code and AI with me - please reach out to me at any of my socials.  Hope you have a great day!

`;

export const dynamic = "force-static";

export function GET() {
  return new Response(content, {
    headers: { "Content-Type": "text/plain; charset=utf-8" },
  });
}
