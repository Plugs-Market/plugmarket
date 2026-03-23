import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { crypto } from "https://deno.land/std@0.224.0/crypto/mod.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

// BIP39-inspired French wordlist (256 words for seed generation)
const WORDLIST = [
  "abandon","abricot","acier","adresse","aérer","agiter","aider","ajouter","alarme","album",
  "algue","amour","ancien","animal","anneau","aperçu","appel","arbre","argent","armure",
  "aspect","astre","atelier","attente","aurore","avenir","avion","balcon","bambou","banane",
  "barque","bâtir","beauté","berger","beurre","bijou","blague","bohème","bonbon","border",
  "bougie","brave","briser","bronze","brume","bureau","cabane","cadeau","calmer","canard",
  "carnet","casque","cerise","chalet","charme","chemin","chimie","ciment","cirage","cirque",
  "clamer","climat","cobalt","coffre","colère","combat","comète","confit","copain","corail",
  "cosmos","coteau","couler","crayon","crédit","cristal","crosse","cuivre","cyber","dauphin",
  "déclin","défaut","déjeuner","démon","dépôt","désert","devoir","diamant","diriger","dossier",
  "double","drapeau","durée","éblouir","écart","éclore","écume","éditer","effroi","égalité",
  "élan","émeute","empire","enclos","énergie","enfant","énigme","ennemi","époque","épreuve",
  "errant","escale","espoir","étaler","étoile","étrange","évader","évoluer","exiger","extrême",
  "fable","facile","falaise","famille","fantôme","farine","faveur","fendre","fermer","feuille",
  "ficelle","fièvre","filmer","flamme","flèche","fleurir","flocon","fondre","forêt","fortune",
  "foudre","fragile","freiner","fromage","fugitif","fureur","galerie","garder","gazette","géante",
  "gelée","génial","germer","gibier","glacier","glisser","globe","gorille","goutte","grâce",
  "grandir","grave","grenier","griffon","grotte","guérir","habiter","hameau","harpe","hésiter",
  "hibou","hippie","horizon","humble","humide","iceberg","ignorer","illégal","image","immense",
  "impact","imprévu","incendie","indice","inédit","infini","ingérer","inouï","insecte","instant",
  "intègre","intrigue","inviter","ironie","isoler","ivoire","jardin","jasmin","jaunir","jeton",
  "jongler","joueur","journal","jubiler","jungle","justice","kayak","kiosque","labeur","lacérer",
  "laisser","lampe","lancer","large","laurier","laver","légende","lenteur","lettre","lézard",
  "liberté","limite","limpide","loisir","lotus","louange","lumière","lundi","lunette","lustre",
  "machine","magie","maison","malice","manège","marbre","masque","matin","méduse","mélodie"
];

function generateSeedPhrase(): string {
  const indices = new Uint32Array(16);
  crypto.getRandomValues(indices);
  return Array.from(indices)
    .map((n) => WORDLIST[n % WORDLIST.length])
    .join(" ");
}

async function hashValue(value: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(value);
  const hashBuffer = await crypto.subtle.digest("SHA-256", data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { username, password } = await req.json();

    if (!username || !password) {
      return new Response(
        JSON.stringify({ error: "Pseudo et mot de passe requis" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (username.length < 3 || username.length > 30) {
      return new Response(
        JSON.stringify({ error: "Le pseudo doit contenir entre 3 et 30 caractères" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (password.length < 8) {
      return new Response(
        JSON.stringify({ error: "Le mot de passe doit contenir au moins 8 caractères" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    // Check if username already exists
    const { data: existing } = await supabase
      .from("app_users")
      .select("id")
      .eq("username", username.toLowerCase().trim())
      .maybeSingle();

    if (existing) {
      return new Response(
        JSON.stringify({ error: "Ce pseudo est déjà pris" }),
        { status: 409, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Generate seed phrase
    const seedPhrase = generateSeedPhrase();

    // Hash password and seed phrase
    const passwordHash = await hashValue(password);
    const seedHash = await hashValue(seedPhrase);

    // Insert user
    const { error: insertError } = await supabase.from("app_users").insert({
      username: username.toLowerCase().trim(),
      password_hash: passwordHash,
      seed_hash: seedHash,
    });

    if (insertError) {
      console.error("Insert error:", insertError);
      return new Response(
        JSON.stringify({ error: "Erreur lors de la création du compte" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Return seed phrase (shown only once to user)
    return new Response(
      JSON.stringify({
        success: true,
        seed_phrase: seedPhrase,
        message: "Compte créé avec succès. Sauvegardez votre phrase de récupération !",
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Registration error:", error);
    return new Response(
      JSON.stringify({ error: "Erreur serveur" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
