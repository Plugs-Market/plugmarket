import { ArrowLeft } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";

const TermsPage = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background pb-12">
      <div className="px-4 py-6 max-w-2xl mx-auto">
        <Button variant="ghost" size="icon" onClick={() => navigate(-1)} className="mb-4">
          <ArrowLeft size={20} />
        </Button>

        <h1 className="font-display text-2xl font-bold neon-text mb-6">
          Conditions d'Utilisation
        </h1>

        <div className="space-y-6 text-sm text-muted-foreground leading-relaxed">
          <p>
            Bienvenue 👋<br />
            Ce bot officiel a pour unique objectif de vous rediriger vers nos canaux Telegram officiels.
            Veuillez utiliser les liens via le bot et accepter nos politiques avant d'accéder aux contenus.
          </p>

          <section>
            <h2 className="text-base font-semibold text-foreground mb-2">1. Objet du bot</h2>
            <p>Ce bot est fourni uniquement afin de rediriger les utilisateurs vers les canaux Telegram officiels associés au service.</p>
          </section>

          <section>
            <h2 className="text-base font-semibold text-foreground mb-2">2. Utilisation autorisée</h2>
            <p className="mb-2">Vous acceptez de ne pas utiliser ce bot de manière abusive, notamment :</p>
            <ul className="list-disc list-inside space-y-1 ml-2">
              <li>Envoyer des requêtes automatisées ou excessives</li>
              <li>Tenter de perturber ou de surcharger le service</li>
              <li>Tenter d'exploiter ou de contourner le fonctionnement du bot</li>
            </ul>
          </section>

          <section>
            <h2 className="text-base font-semibold text-foreground mb-2">3. Disponibilité du service</h2>
            <p>Le service est fourni « tel quel ». Nous ne garantissons pas une disponibilité continue ou sans interruption du bot.</p>
          </section>

          <section>
            <h2 className="text-base font-semibold text-foreground mb-2">4. Redirection vers des canaux</h2>
            <p>Le bot peut rediriger les utilisateurs vers des canaux Telegram officiels. Ces canaux sont gérés indépendamment et leur contenu peut évoluer.</p>
          </section>

          <section>
            <h2 className="text-base font-semibold text-foreground mb-2">5. Responsabilité</h2>
            <p>Les administrateurs du bot ne peuvent être tenus responsables de toute perte ou dommage résultant de l'utilisation du bot ou de l'accès aux canaux mentionnés.</p>
          </section>

          <section>
            <h2 className="text-base font-semibold text-foreground mb-2">6. Données et confidentialité</h2>
            <p>Le bot ne collecte pas de données personnelles sensibles.</p>
          </section>

          <section>
            <h2 className="text-base font-semibold text-foreground mb-2">7. Modifications</h2>
            <p>Les administrateurs se réservent le droit de modifier ces conditions à tout moment sans préavis. Les modifications seront publiées sur cette page.</p>
          </section>

          <section>
            <h2 className="text-base font-semibold text-foreground mb-2">8. Acceptation</h2>
            <p>En utilisant le bot, vous confirmez avoir lu et accepté ces Conditions d'Utilisation.</p>
          </section>
        </div>
      </div>
    </div>
  );
};

export default TermsPage;
