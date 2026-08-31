import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { StarfieldHero } from "@/components/starfield-hero";
import { Button } from "@/components/ui/button";
import Image from 'next/image'

export default function Home() {
  interface Experience {
    job:string,
    description:string,
    time:string
  }

  const CurrentExperience: Experience[] = [ {job:"CDW", description:"Lead Software Developer for CDW DeviceCycle", time:"April 2026 - Current"},  {job:"Lexicon Tech Solutions", description:"Software developer", time:"April 2024 - April 2026"}, {job:"Exela Pharma Sciences", description:"QC Microbiologist", time:"August 2021 - August 2022"}];

  const CurrentRole = "CDW";

  interface Projects {
    name:string,
    link:string
  }

  const HighlightedProjects: Projects[] = [ ]

  const imageStyle = {
  borderRadius: '50%',
  
}

  return (
    <div className="flex flex-1 flex-col">
      <SiteHeader />
      <main className="flex-1">
        <StarfieldHero />

        <section id="about" className="mx-auto w-full max-w-3xl px-4 py-24 sm:px-6">
          <h2 className="text-3xl font-semibold tracking-tight">About</h2>
          <Image className="my-4" src="/ethan.jpeg" alt="Ethan Wiegert" height={100} width={100} style={imageStyle}/>
          <p className="mt-4 text-muted-foreground">
            <b><i>From Microbiologist to Full-stack developer</i></b>
          </p>
          <p className="mt-3 text-muted-foreground">
            I originally obtained my Bachelors of Science in Microbiology in 2021.  I began my career working as a QC Microbiologist testing for the presence of bacteria and fungi in liquid injectibles in the Pharmaceutical industry.  Years later, I learned Javascript and fell in love with programming.  Now the only bugs I deal with are in code.
          </p>
        </section>

        <section id="projects" className="mx-auto w-full max-w-3xl px-4 py-24 sm:px-6">
          <h2 className="text-3xl font-semibold tracking-tight">Projects</h2>
          <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-3">
            {HighlightedProjects.length>0 ? 
            
            HighlightedProjects.map((i) => (
              <div
                key={i.name}
                className="flex min-h-32 items-center justify-center rounded-lg border border-dashed border-border p-4 text-center text-sm text-muted-foreground"
              >
                <a href={i.link} target="blank">{i.name}</a>
              </div>
            )) 

            :

            <p><i>Personal projects coming here soon!</i></p>
          }
          </div>
        </section>

        <section id="experience" className="mx-auto w-full max-w-3xl px-4 py-24 sm:px-6">
          <h2 className="text-3xl font-semibold tracking-tight">Experience</h2>
          <div className="mt-6 space-y-0">
            {CurrentExperience.map((i) => (
              <div key={i.job} className="flex gap-4 pb-10 last:pb-0">
                <div className="flex flex-col items-center">
                   {i.job == CurrentRole ? <span className="mt-1.5 size-2.5 rounded-full bg-green-900 animate-pulse" /> : <span className="mt-1.5 size-2.5 rounded-full bg-primary" />}
                  <span className="w-px flex-1 bg-border" />
         
                </div>
                <div className="flex-col">
                <p><b>{i.job}</b></p>
                <p className="text-sm"><i>{i.time}</i></p>
                <p>{i.description}</p>
                </div>
              </div>
            ))}
          </div>
        </section>

        <section id="contact" className="mx-auto w-full max-w-3xl px-4 py-8 sm:px-6">
          <div className="flex flex-col items-center gap-4 p-6">
            <address>
              <a href="mailto:ewiegert99@gmail.com">Contact Ethan</a>
            </address>
          </div>
        </section>
      </main>
      <SiteFooter />
    </div>
  );
}
