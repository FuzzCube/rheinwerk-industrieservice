"use client";

import { useState } from "react";
import { Bot, Send, X } from "lucide-react";

const answers: Record<string, { answer?: string; sources?: string[]; critical?: boolean }> = {
  "Was kostet eine Inspektion?": { answer: "Eine Inspektion kostet 290 EUR netto je Maschine. Dazu kommt die Anfahrt mit 1,20 EUR netto je gefahrenem Kilometer ab Mannheim und zurück, mindestens 45 EUR netto. Individuelle Aufträge und vereinbarte SLA haben Vorrang.", sources: ["Leistungen · Preisübersicht", "Leistungen · Anfahrt"] },
  "Gilt der 24/7-Notfallkanal für alle Kunden?": { answer: "Nein. Der 24/7-Notfallkanal besteht ausschließlich für Kunden mit ausdrücklich vereinbartem Notfall-SLA. Ohne SLA gelten die Servicezeiten Mo–Fr 07:00–18:00.", sources: ["Kontakt · Servicezeiten"] },
  "Welche Anlagen betreuen Sie?": { answer: "Pumpen, Kompressoren und industrielle Lüftungsanlagen. Anfragen zu anderen Anlagentypen beantwortet der Service Desk mit einer Absage oder einer Empfehlung.", sources: ["Startseite · Anlagen und Geräte"] },
  "Wie werden kritische Fälle behandelt?": { critical: true },
};

const suggestions = Object.keys(answers);

export function Assistant() {
  const [open, setOpen] = useState(false);
  const [question, setQuestion] = useState("");
  const [result, setResult] = useState<{ answer?: string; sources?: string[]; critical?: boolean } | null>(null);
  const ask = (value: string) => { setQuestion(value); setResult(answers[value] ?? { answer: "Dazu liegen mir keine verlässlichen Informationen vor. Ich kann Ihre Anfrage an den Service Desk übergeben." }); };
  if (!open) return <button className="assistant-launcher" type="button" onClick={() => setOpen(true)} aria-label="RheinWerk Assistent öffnen"><Bot size={24} /></button>;
  return (
    <aside className="assistant-panel" aria-label="RheinWerk Assistent">
      <header><div><Bot size={20} /><span>RheinWerk Assistent</span></div><button type="button" onClick={() => setOpen(false)} aria-label="Assistent schließen"><X size={20} /></button></header>
      <div className="assistant-panel__body">
        {!result ? <><p>Guten Tag. Ich beantworte Fragen zu Leistungen, Anlagen, Preisrahmen und Servicezeiten auf Basis der veröffentlichten Dokumente.</p><div className="assistant-suggestions">{suggestions.map((item) => <button type="button" key={item} onClick={() => ask(item)}>{item}</button>)}</div></> : <>
          <p className="assistant-question">{question}</p>
          {result.critical ? <div className="assistant-critical"><strong>Kritischer Fall</strong><p>Dieser Fall muss durch einen Menschen geprüft werden. Bitte melden Sie ihn zusätzlich telefonisch unter +49 621 00000-0.</p></div> : <p>{result.answer}</p>}
          {result.sources && <div className="assistant-sources">{result.sources.map((source) => <span key={source}>{source}</span>)}</div>}
          <button className="assistant-back" type="button" onClick={() => { setQuestion(""); setResult(null); }}>Andere Frage wählen</button>
        </>}
      </div>
      <form onSubmit={(event) => { event.preventDefault(); ask(question); }}><input value={question} onChange={(event) => setQuestion(event.target.value)} aria-label="Frage an den Assistenten" placeholder="Frage eingeben" /><button type="submit" aria-label="Frage senden"><Send size={18} /></button></form>
    </aside>
  );
}
