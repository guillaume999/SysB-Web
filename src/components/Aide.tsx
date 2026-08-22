import type { ReactNode } from "react";

/**
 * Bloc d'aide repliable, posé sous une section du formulaire.
 *
 * Volontairement un `<details>` natif : pas d'état React à porter, ouverture au
 * clavier gratuite, et l'aide reste fermée par défaut pour ne pas encombrer un
 * écran qu'on finira par connaître par coeur.
 */
export default function Aide({
  titre = "Comment ça marche",
  children,
}: {
  titre?: string;
  children: ReactNode;
}) {
  return (
    <details className="mt-2 rounded border border-edge bg-ink/40 text-xs text-slate-400">
      <summary className="cursor-pointer select-none px-3 py-1.5 text-slate-500 transition-colors hover:text-white">
        {titre}
      </summary>
      <div className="space-y-2 border-t border-edge px-3 py-2 leading-relaxed">{children}</div>
    </details>
  );
}

/** Une entrée « terme : explication » dans un bloc d'aide. */
export function Terme({ nom, children }: { nom: string; children: ReactNode }) {
  return (
    <p>
      <span className="font-medium text-slate-200">{nom}</span>{" "}
      <span className="text-slate-500">— </span>
      {children}
    </p>
  );
}
