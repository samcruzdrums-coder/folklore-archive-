import { useMemo, useRef, useState, type ReactNode } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import {
  ArrowLeft,
  ArrowRight,
  Compass,
  Headphones,
  Menu,
  Pause,
  Play,
  Search,
  Sparkles,
  X,
} from 'lucide-react';
import { Link, Route, Switch, useLocation, useParams } from 'wouter';
import {
  getGetArchiveSummaryQueryKey,
  getGetRecordingQueryKey,
  getListInstrumentsQueryKey,
  getListRecordingsQueryKey,
  getListRegionsQueryKey,
  useGetArchiveSummary,
  useGetRecording,
  useListInstruments,
  useListRecordings,
  useListRegions,
} from '@workspace/api-client-react';
import type {
  InstrumentSummary,
  Recording,
  RegionSummary,
} from '@workspace/api-client-react';
import { ErrorBoundary } from '@/components/error-boundary';
import { Toaster } from '@/components/ui/toaster';
import { TooltipProvider } from '@/components/ui/tooltip';
import NotFound from '@/pages/not-found';
import { Router as WouterRouter } from 'wouter';

const queryClient = new QueryClient();

function Mark({ compact = false }: { compact?: boolean }) {
  return (
    <Link href="/" className={`focus-ring group inline-flex items-center gap-3 ${compact ? '' : 'mb-12'}`} data-testid="link-brand">
      <span className="relative flex h-10 w-10 items-center justify-center border border-sidebar-primary/60 text-sidebar-primary">
        <span className="absolute h-5 w-5 rounded-full border border-sidebar-primary/70" />
        <span className="absolute h-px w-8 bg-sidebar-primary/80 rotate-45" />
        <span className="absolute h-px w-8 bg-sidebar-primary/80 -rotate-45" />
      </span>
      <span className="leading-none">
        <span className="block font-serif text-lg tracking-tight text-sidebar-foreground">World Folkloric</span>
        <span className="mt-1 block font-mono text-[9px] uppercase tracking-[.23em] text-sidebar-primary">Music archive</span>
      </span>
    </Link>
  );
}

function Shell({ children }: { children: ReactNode }) {
  const [menuOpen, setMenuOpen] = useState(false);
  const [location] = useLocation();
  const links = [
    { href: '/', label: 'Listen & discover', icon: Headphones },
    { href: '/regions', label: 'Regions', icon: Compass },
    { href: '/instruments', label: 'Instruments', icon: Sparkles },
  ];
  return (
    <div className="paper-grain min-h-[100dvh] bg-background">
      <aside className="fixed inset-y-0 left-0 z-40 hidden w-[256px] flex-col bg-sidebar px-7 py-8 text-sidebar-foreground md:flex">
        <Mark />
        <p className="max-w-[180px] font-serif text-[15px] leading-relaxed text-sidebar-foreground/65">
          A listening room for music carried by memory, place, and people.
        </p>
        <nav className="mt-14 space-y-2" aria-label="Primary navigation">
          {links.map(({ href, label, icon: Icon }) => (
            <Link
              href={href}
              key={href}
              className={`focus-ring group flex items-center gap-3 border-l px-3 py-3 font-mono text-[10px] uppercase tracking-[.16em] transition-colors ${location === href ? 'border-sidebar-primary bg-sidebar-accent text-sidebar-primary' : 'border-transparent text-sidebar-foreground/58 hover:border-sidebar-primary/50 hover:bg-sidebar-accent/70 hover:text-sidebar-foreground'}`}
              data-testid={`link-nav-${label.toLowerCase().replaceAll(' ', '-')}`}
            >
              <Icon className="h-4 w-4 transition-transform group-hover:rotate-[-8deg]" strokeWidth={1.5} />
              {label}
            </Link>
          ))}
        </nav>
        <div className="mt-auto border-t border-sidebar-border pt-5">
          <p className="font-mono text-[9px] uppercase tracking-[.2em] text-sidebar-foreground/40">Field note 01</p>
          <p className="mt-3 font-serif text-[14px] leading-relaxed text-sidebar-foreground/70">
            “The song is a map when the road is gone.”
          </p>
          <p className="mt-3 font-mono text-[9px] text-sidebar-foreground/40">— archive notebook</p>
        </div>
      </aside>
      <header className="relative z-30 flex items-center justify-between border-b border-border bg-sidebar px-5 py-4 md:hidden">
        <Mark compact />
        <button type="button" className="focus-ring p-2 text-sidebar-foreground" onClick={() => setMenuOpen(!menuOpen)} aria-label="Toggle menu" data-testid="button-toggle-menu">
          {menuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
        {menuOpen && (
          <nav className="absolute inset-x-0 top-full border-t border-sidebar-border bg-sidebar px-5 py-3" aria-label="Mobile navigation">
            {links.map(({ href, label }) => (
              <Link key={href} href={href} onClick={() => setMenuOpen(false)} className="focus-ring block border-b border-sidebar-border py-4 font-mono text-[10px] uppercase tracking-[.16em] text-sidebar-foreground/75" data-testid={`link-mobile-${label.toLowerCase().replaceAll(' ', '-')}`}>
                {label}
              </Link>
            ))}
          </nav>
        )}
      </header>
      <main className="md:ml-[256px]">{children}</main>
    </div>
  );
}

function PageIntro({ eyebrow, title, copy, children }: { eyebrow: string; title: string; copy: string; children?: ReactNode }) {
  return (
    <section className="border-b border-border px-5 pb-10 pt-10 sm:px-10 lg:px-16 lg:pb-14 lg:pt-16">
      <div className="flex flex-col gap-8 lg:flex-row lg:items-end lg:justify-between">
        <div className="max-w-3xl animate-drift-in">
          <div className="mb-5 flex items-center gap-3 font-mono text-[10px] uppercase tracking-[.24em] text-accent">
            <span className="h-px w-9 bg-accent" /> {eyebrow}
          </div>
          <h1 className="max-w-3xl font-serif text-5xl leading-[.96] tracking-[-.045em] text-foreground sm:text-6xl lg:text-8xl" data-testid="heading-page">{title}</h1>
          <p className="mt-6 max-w-xl font-serif text-lg leading-relaxed text-muted-foreground sm:text-xl" data-testid="text-page-intro">{copy}</p>
        </div>
        {children}
      </div>
    </section>
  );
}

function Status({ kind, message, retry }: { kind: 'loading' | 'error' | 'empty'; message: string; retry?: () => void }) {
  if (kind === 'loading') {
    return <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3" data-testid="status-loading">{[1, 2, 3].map((item) => <div className="h-[310px] animate-pulse border border-border bg-card/60" key={item}><div className="h-44 bg-muted/60" /><div className="space-y-3 p-5"><div className="h-3 w-1/3 bg-muted" /><div className="h-6 w-3/4 bg-muted" /><div className="h-3 w-1/2 bg-muted" /></div></div>)}</div>;
  }
  return (
    <div className="border border-border bg-card px-7 py-14 text-center" data-testid={`status-${kind}`}>
      <div className="mx-auto mb-5 flex h-11 w-11 items-center justify-center border border-accent/50 text-accent">{kind === 'error' ? <X className="h-5 w-5" /> : <Search className="h-5 w-5" />}</div>
      <p className="font-serif text-xl text-foreground">{message}</p>
      {retry && <button onClick={retry} className="focus-ring mt-5 border border-primary bg-primary px-4 py-2 font-mono text-[10px] uppercase tracking-[.15em] text-primary-foreground transition-colors hover:bg-accent" data-testid="button-retry">Try again</button>}
    </div>
  );
}

function AudioButton({ recording, large = false }: { recording: Recording; large?: boolean }) {
  const [playing, setPlaying] = useState(false);
  const audioRef = useRef<HTMLAudioElement>(null);
  const toggle = () => {
    if (!recording.audioUrl) return;
    if (playing) audioRef.current?.pause();
    else void audioRef.current?.play();
    setPlaying(!playing);
  };
  return (
    <>
      <button type="button" onClick={toggle} disabled={!recording.audioUrl} className={`focus-ring group inline-flex items-center justify-center gap-3 border transition-colors ${large ? 'h-14 w-full border-primary bg-primary px-5 text-primary-foreground hover:bg-accent' : 'h-11 w-11 rounded-full border-sidebar-primary/70 text-sidebar-primary hover:bg-sidebar-primary hover:text-sidebar-primary-foreground'} ${!recording.audioUrl ? 'cursor-not-allowed opacity-40' : ''}`} aria-label={playing ? `Pause ${recording.title}` : `Play ${recording.title}`} data-testid={`button-audio-${recording.id}`}>
        {playing ? <Pause className="h-4 w-4 fill-current" /> : <Play className="h-4 w-4 fill-current" />}
        {large && <span className="font-mono text-[10px] uppercase tracking-[.18em]">{playing ? 'Pause excerpt' : 'Play excerpt'}</span>}
      </button>
      {recording.audioUrl && <audio ref={audioRef} src={recording.audioUrl} onEnded={() => setPlaying(false)} />}
    </>
  );
}

function RecordingArtwork({ recording, feature = false }: { recording: Recording; feature?: boolean }) {
  return (
    <div className={`relative overflow-hidden ${feature ? 'h-full min-h-[360px]' : 'h-44'}`}>
      <div className="absolute inset-0 bg-[linear-gradient(135deg,hsl(220_31%_20%),hsl(164_22%_45%))]" />
      <div className="absolute inset-0 opacity-70" style={{ backgroundImage: 'repeating-linear-gradient(112deg, transparent 0, transparent 16px, hsl(40 78% 64% / .25) 17px, transparent 18px), repeating-linear-gradient(22deg, transparent 0, transparent 30px, hsl(13 53% 51% / .34) 31px, transparent 33px)' }} />
      {recording.imageUrl && <img src={recording.imageUrl} alt="" className="image-wash absolute inset-0 h-full w-full object-cover mix-blend-soft-light opacity-75 transition-transform duration-700 group-hover:scale-105" />}
      <div className="absolute bottom-4 left-4 flex items-center gap-2 font-mono text-[9px] uppercase tracking-[.16em] text-primary-foreground/75"><span className="h-2 w-2 rounded-full bg-primary" /> field recording / {recording.yearCollected}</div>
    </div>
  );
}

function RecordingCard({ recording, index = 0 }: { recording: Recording; index?: number }) {
  return (
    <article className="group animate-drift-in border border-border bg-card transition-all duration-300 hover:-translate-y-1 hover:border-accent/60 hover:shadow-[8px_8px_0_hsl(13_53%_51%/.13)]" style={{ animationDelay: `${index * 70}ms` }} data-testid={`card-recording-${recording.id}`}>
      <Link href={`/recordings/${recording.id}`} className="focus-ring block" data-testid={`link-recording-${recording.id}`}>
        <RecordingArtwork recording={recording} />
        <div className="p-5">
          <div className="mb-3 flex items-center justify-between gap-2 font-mono text-[9px] uppercase tracking-[.17em] text-muted-foreground">
            <span>{recording.region}</span><span>{recording.duration}</span>
          </div>
          <h3 className="font-serif text-2xl leading-tight text-foreground transition-colors group-hover:text-accent" data-testid={`text-recording-title-${recording.id}`}>{recording.title}</h3>
          <p className="mt-2 text-sm text-muted-foreground">{recording.tradition} · {recording.instrument}</p>
          <div className="mt-5 flex items-center justify-between border-t border-border pt-4">
            <span className="font-mono text-[9px] uppercase tracking-[.14em] text-muted-foreground">{recording.community}</span>
            <span className="font-mono text-[10px] text-accent">View entry <ArrowRight className="ml-1 inline h-3 w-3 transition-transform group-hover:translate-x-1" /></span>
          </div>
        </div>
      </Link>
    </article>
  );
}

function Home() {
  const [search, setSearch] = useState('');
  const [location] = useLocation();
  const browseParams = useMemo(() => new URLSearchParams(location.split('?')[1] ?? ''), [location]);
  const selectedRegion = browseParams.get('region') ?? undefined;
  const selectedInstrument = browseParams.get('instrument') ?? undefined;
  const params = useMemo(() => ({ q: search.trim() || undefined, region: selectedRegion, instrument: selectedInstrument, limit: 50 }), [search, selectedRegion, selectedInstrument]);
  const recordings = useListRecordings(params, { query: { queryKey: getListRecordingsQueryKey(params) } });
  const summary = useGetArchiveSummary({ query: { queryKey: getGetArchiveSummaryQueryKey() } });
  const featured = summary.data?.featured;
  return (
    <div>
      <section className="relative overflow-hidden border-b border-border px-5 pb-12 pt-12 sm:px-10 lg:px-16 lg:pb-20 lg:pt-16">
        <div className="absolute right-[-7rem] top-[-8rem] h-[28rem] w-[28rem] rounded-full border border-accent/25 lg:right-[-4rem]" /><div className="absolute right-[-4rem] top-[-5rem] h-[22rem] w-[22rem] rounded-full border border-accent/20" />
        <div className="relative max-w-5xl">
          <div className="mb-7 flex items-center gap-3 font-mono text-[10px] uppercase tracking-[.24em] text-accent animate-drift-in"><span className="h-px w-9 bg-accent" /> An annotated listening room</div>
          <h1 className="max-w-4xl font-serif text-[clamp(4rem,11vw,10rem)] leading-[.84] tracking-[-.06em] text-foreground animate-drift-in">Songs remember<br /><span className="text-accent">where we are.</span></h1>
          <div className="mt-10 flex max-w-2xl flex-col justify-between gap-6 border-t border-border pt-6 sm:flex-row sm:items-start">
            <p className="max-w-md font-serif text-lg leading-relaxed text-muted-foreground animate-drift-in-delay">A growing field archive of traditional music, gathered with the names, places, instruments, and stories that let each recording breathe.</p>
            <span className="font-mono text-[10px] uppercase leading-relaxed tracking-[.16em] text-muted-foreground/70 animate-drift-in-delay-2">Listen slowly<br />Look closely<br />Follow the thread</span>
          </div>
        </div>
      </section>
      {featured && (
        <section className="grid border-b border-border lg:grid-cols-[1fr_1.1fr]">
          <div className="min-h-[330px] bg-primary p-7 text-primary-foreground sm:p-10 lg:p-16">
            <div className="flex items-center justify-between font-mono text-[10px] uppercase tracking-[.2em] text-primary-foreground/60"><span>Archive no. {String(featured.id).padStart(4, '0')}</span><span>Featured listening</span></div>
            <div className="mt-24 max-w-md lg:mt-32">
              <p className="font-mono text-[10px] uppercase tracking-[.18em] text-primary-foreground/55">{featured.country} · {featured.yearCollected}</p>
              <h2 className="mt-3 font-serif text-4xl leading-[.95] sm:text-5xl" data-testid="text-featured-title">{featured.title}</h2>
              <p className="mt-4 font-serif text-base leading-relaxed text-primary-foreground/70">{featured.description}</p>
              <Link href={`/recordings/${featured.id}`} className="focus-ring mt-8 inline-flex items-center gap-2 border-b border-sidebar-primary pb-2 font-mono text-[10px] uppercase tracking-[.17em] text-sidebar-primary hover:text-primary-foreground" data-testid={`link-featured-${featured.id}`}>Enter the field note <ArrowRight className="h-3 w-3" /></Link>
            </div>
          </div>
          <div className="relative min-h-[330px] bg-muted lg:min-h-[500px]">
            <RecordingArtwork recording={featured} feature />
            <div className="absolute bottom-7 left-7 max-w-[190px] border-l-2 border-primary pl-4 font-serif text-sm italic leading-relaxed text-primary-foreground/90">“The first instrument is always the landscape.”</div>
          </div>
        </section>
      )}
      <section className="px-5 py-12 sm:px-10 lg:px-16 lg:py-20">
          <div className="mb-8 flex flex-col justify-between gap-5 sm:flex-row sm:items-end">
          <div><div className="mb-3 flex items-center gap-3 font-mono text-[10px] uppercase tracking-[.22em] text-accent"><span className="h-px w-7 bg-accent" /> The collection</div><h2 className="font-serif text-4xl tracking-tight text-foreground sm:text-5xl">Start somewhere.</h2></div>
          <label className="flex w-full max-w-sm items-center gap-3 border-b border-primary/40 pb-3 text-muted-foreground focus-within:border-accent sm:w-72" data-testid="label-search-recordings"><Search className="h-4 w-4" /><input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search songs, places, people..." className="w-full bg-transparent font-mono text-[11px] tracking-[.05em] text-foreground outline-none placeholder:text-muted-foreground/70" data-testid="input-search-recordings" /></label>
        </div>
        {(selectedRegion || selectedInstrument) && <div className="mb-7 flex items-center gap-3 font-mono text-[10px] uppercase tracking-[.14em] text-muted-foreground"><span>Filtered by</span><span className="border border-accent/50 bg-accent/5 px-3 py-2 text-accent">{selectedRegion ?? selectedInstrument}</span><Link href="/" className="focus-ring border-b border-muted-foreground/50 pb-1 hover:text-accent" data-testid="link-clear-filter">Clear filter</Link></div>}
        {recordings.isLoading && <Status kind="loading" message="" />}
        {recordings.isError && <Status kind="error" message="The shelves are quiet right now." retry={() => void recordings.refetch()} />}
        {!recordings.isLoading && !recordings.isError && recordings.data?.length === 0 && <Status kind="empty" message="No recordings match that thread. Try another place or instrument." />}
        {!recordings.isLoading && !recordings.isError && recordings.data && recordings.data.length > 0 && <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">{recordings.data.map((recording, index) => <RecordingCard key={recording.id} recording={recording} index={index} />)}</div>}
      </section>
      <section className="border-t border-border bg-secondary/10 px-5 py-14 sm:px-10 lg:px-16">
        <div className="grid gap-10 lg:grid-cols-[1fr_2fr] lg:items-end"><div><p className="font-mono text-[10px] uppercase tracking-[.2em] text-accent">The archive, in numbers</p><p className="mt-4 max-w-sm font-serif text-3xl leading-tight text-foreground">Every number is a doorway to a living practice.</p></div><div className="grid grid-cols-2 gap-6 sm:grid-cols-4">{[['recordings', summary.data?.recordingCount], ['regions', summary.data?.regionCount], ['instruments', summary.data?.instrumentCount], ['traditions', summary.data?.traditionCount]].map(([label, value]) => <div key={String(label)} className="border-t border-border pt-3"><p className="font-mono text-3xl text-accent" data-testid={`stat-${label}`}>{value ?? '—'}</p><p className="mt-2 font-mono text-[9px] uppercase tracking-[.16em] text-muted-foreground">{label}</p></div>)}</div></div>
      </section>
    </div>
  );
}

function Regions() {
  const regions = useListRegions({ query: { queryKey: getListRegionsQueryKey() } });
  return <div><PageIntro eyebrow="Atlas / 01" title="Follow the route." copy="Browse the archive by the places where a song takes root. Regions here are not borders; they are currents, crossings, and shared ways of listening." /><section className="px-5 py-12 sm:px-10 lg:px-16 lg:py-16">{regions.isLoading && <Status kind="loading" message="" />}{regions.isError && <Status kind="error" message="The atlas could not be opened." retry={() => void regions.refetch()} />}{!regions.isLoading && !regions.isError && regions.data?.length === 0 && <Status kind="empty" message="No regions have been catalogued yet." />}{regions.data && regions.data.length > 0 && <div className="grid gap-x-8 gap-y-0 md:grid-cols-2">{regions.data.map((region, index) => <RegionRow key={region.region} region={region} index={index} />)}</div>}</section></div>;
}

function RegionRow({ region, index }: { region: RegionSummary; index: number }) {
  const slug = region.region.toLowerCase().replaceAll(' ', '-');
  return <Link href={`/?region=${encodeURIComponent(region.region)}`} className="focus-ring group flex items-center justify-between border-t border-border py-6 transition-colors hover:bg-accent/5" data-testid={`link-region-${slug}`}><span className="flex items-baseline gap-5"><span className="font-mono text-[10px] text-muted-foreground/60">{String(index + 1).padStart(2, '0')}</span><span className="font-serif text-3xl text-foreground transition-colors group-hover:text-accent" data-testid={`text-region-${slug}`}>{region.region}</span></span><span className="text-right"><span className="block font-mono text-[10px] uppercase tracking-[.14em] text-accent" data-testid={`text-region-count-${slug}`}>{region.count} recordings</span><span className="mt-1 block font-mono text-[9px] uppercase tracking-[.12em] text-muted-foreground" data-testid={`text-region-countries-${slug}`}>{region.countries} countries <ArrowRight className="ml-1 inline h-3 w-3 transition-transform group-hover:translate-x-1" /></span></span></Link>;
}

function Instruments() {
  const instruments = useListInstruments({ query: { queryKey: getListInstrumentsQueryKey() } });
  return <div><PageIntro eyebrow="Listening tools / 02" title="Meet the instruments." copy="A catalogue of breath, skin, string, wood, and metal — each one a technology for carrying a community's memory." /><section className="px-5 py-12 sm:px-10 lg:px-16 lg:py-16">{instruments.isLoading && <Status kind="loading" message="" />}{instruments.isError && <Status kind="error" message="The instrument room is closed for a moment." retry={() => void instruments.refetch()} />}{!instruments.isLoading && !instruments.isError && instruments.data?.length === 0 && <Status kind="empty" message="No instruments have been catalogued yet." />}{instruments.data && instruments.data.length > 0 && <div className="grid grid-cols-1 gap-px border border-border bg-border sm:grid-cols-2 lg:grid-cols-3">{instruments.data.map((instrument, index) => <InstrumentTile key={instrument.instrument} instrument={instrument} index={index} />)}</div>}</section></div>;
}

function InstrumentTile({ instrument, index }: { instrument: InstrumentSummary; index: number }) {
  const slug = instrument.instrument.toLowerCase().replaceAll(' ', '-');
  return <Link href={`/?instrument=${encodeURIComponent(instrument.instrument)}`} className="focus-ring group bg-background p-7 transition-colors hover:bg-primary hover:text-primary-foreground sm:p-9" data-testid={`link-instrument-${slug}`}><span className="mb-12 block font-mono text-[10px] text-muted-foreground transition-colors group-hover:text-primary-foreground/60" data-testid={`text-instrument-count-${slug}`}>{String(index + 1).padStart(2, '0')} / {instrument.count} entries</span><span className="block font-serif text-3xl leading-none text-foreground transition-colors group-hover:text-primary-foreground" data-testid={`text-instrument-${slug}`}>{instrument.instrument}</span><span className="mt-7 flex items-center gap-2 font-mono text-[9px] uppercase tracking-[.16em] text-accent opacity-0 transition-all group-hover:translate-y-0 group-hover:opacity-100">Listen through <ArrowRight className="h-3 w-3" /></span></Link>;
}

function RecordingDetail() {
  const params = useParams<{ id: string }>();
  const id = Number(params.id);
  const recording = useGetRecording(id, { query: { enabled: Number.isFinite(id), queryKey: getGetRecordingQueryKey(id) } });
  if (recording.isLoading) return <div className="px-5 py-12 sm:px-10 lg:px-16"><Status kind="loading" message="" /></div>;
  if (recording.isError || !recording.data) return <div className="px-5 py-12 sm:px-10 lg:px-16"><Status kind="error" message="This field note could not be found." /></div>;
  const item = recording.data;
  return <article><div className="border-b border-border px-5 py-6 sm:px-10 lg:px-16"><Link href="/" className="focus-ring inline-flex items-center gap-2 font-mono text-[10px] uppercase tracking-[.17em] text-muted-foreground transition-colors hover:text-accent" data-testid="link-back-archive"><ArrowLeft className="h-3 w-3" /> Back to archive</Link></div><section className="grid border-b border-border lg:grid-cols-[.9fr_1.1fr]"><div className="min-h-[400px] bg-primary p-7 text-primary-foreground sm:p-10 lg:p-16"><div className="flex items-start justify-between font-mono text-[10px] uppercase tracking-[.18em] text-primary-foreground/60"><span>Field note / {String(item.id).padStart(4, '0')}</span><span>{item.yearCollected}</span></div><div className="mt-24 max-w-lg lg:mt-36"><p className="font-mono text-[10px] uppercase tracking-[.18em] text-sidebar-primary">{item.region} · {item.country}</p><h1 className="mt-4 font-serif text-5xl leading-[.92] tracking-[-.045em] sm:text-7xl" data-testid="text-recording-detail-title">{item.title}</h1><p className="mt-6 font-serif text-lg leading-relaxed text-primary-foreground/75">{item.description}</p><div className="mt-8 max-w-xs"><AudioButton recording={item} large /></div></div></div><div className="relative min-h-[400px] lg:min-h-[620px]"><RecordingArtwork recording={item} feature /><div className="absolute right-5 top-5 border border-primary-foreground/40 bg-primary/80 px-3 py-2 font-mono text-[10px] text-primary-foreground">{item.duration}</div></div></section><section className="grid gap-12 px-5 py-12 sm:px-10 lg:grid-cols-[1.3fr_.7fr] lg:px-16 lg:py-20"><div><p className="mb-5 font-mono text-[10px] uppercase tracking-[.2em] text-accent">About this recording</p><p className="max-w-2xl font-serif text-2xl leading-relaxed text-foreground">{item.tradition} is held here through the voice of {item.community}, in the form of {item.form}.</p><div className="mt-10 flex flex-wrap gap-2">{item.tags.map((tag) => <span key={tag} className="border border-border px-3 py-2 font-mono text-[9px] uppercase tracking-[.14em] text-muted-foreground" data-testid={`tag-recording-${tag}`}>{tag}</span>)}</div></div><dl className="border-t border-border">{[['Community', item.community], ['Instrument', item.instrument], ['Form', item.form], ['Collected', String(item.yearCollected)], ['Source', item.source]].map(([label, value]) => <div key={label} className="grid grid-cols-[.8fr_1.2fr] border-b border-border py-4"><dt className="font-mono text-[9px] uppercase tracking-[.15em] text-muted-foreground">{label}</dt><dd className="font-serif text-base text-foreground" data-testid={`detail-${label.toLowerCase()}`}>{value}</dd></div>)}</dl></section></article>;
}

function Router() {
  return <Switch><Route path="/" component={Home} /><Route path="/recordings/:id" component={RecordingDetail} /><Route path="/regions" component={Regions} /><Route path="/instruments" component={Instruments} /><Route component={NotFound} /></Switch>;
}

function App() {
  return <QueryClientProvider client={queryClient}><TooltipProvider><WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, '')}><ErrorBoundary><Shell><Router /></Shell></ErrorBoundary></WouterRouter><Toaster /></TooltipProvider></QueryClientProvider>;
}

export default App;