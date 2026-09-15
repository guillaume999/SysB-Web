import { useCallback, useEffect, useMemo, useState, type ReactNode } from "react";
import { AUCUNE_LIMITE, PORTEE_ADMIN, type Portee } from "@/lib/conception";
import { messageErreur } from "@/lib/pb";
import type { Planete } from "@/lib/planetes";
import { PorteeContexte, chargerPortee } from "@/lib/portee";

/**
 * Charge la portée du compte connecté (sa planète, ses limites) une seule fois,
 * et la recharge quand le compte change.
 */
export default function PorteeProvider({
  uid,
  admin,
  children,
}: {
  uid: string;
  admin: boolean;
  children: ReactNode;
}) {
  const [portee, setPortee] = useState<Portee>(
    admin ? PORTEE_ADMIN : { admin: false, uid, planete: null, limites: AUCUNE_LIMITE },
  );
  const [planetes, setPlanetes] = useState<Planete[]>([]);
  const [chargement, setChargement] = useState(true);
  const [erreur, setErreur] = useState<string | null>(null);
  const [tour, setTour] = useState(0);

  useEffect(() => {
    let annule = false;
    setChargement(true);
    chargerPortee(uid, admin)
      .then((r) => {
        if (annule) return;
        setPortee(r.portee);
        setPlanetes(r.planetes);
        setErreur(null);
      })
      .catch((e) => !annule && setErreur(messageErreur(e, "Impossible de lire ta planète.")))
      .finally(() => !annule && setChargement(false));
    return () => {
      annule = true;
    };
  }, [uid, admin, tour]);

  const recharger = useCallback(() => setTour((t) => t + 1), []);
  const valeur = useMemo(
    () => ({ portee, planetes, chargement, erreur, recharger }),
    [portee, planetes, chargement, erreur, recharger],
  );
  return <PorteeContexte.Provider value={valeur}>{children}</PorteeContexte.Provider>;
}
