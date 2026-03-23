import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { crypto } from "https://deno.land/std@0.224.0/crypto/mod.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

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

function normalizeSeedPhrase(seedPhrase: string): string {
  return seedPhrase.trim().toLowerCase().split(/\s+/).join(" ");
}

async function hashValue(value: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(value);
  const hashBuffer = await crypto.subtle.digest("SHA-256", data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");
}

async function generateUniqueSeedPhrase(supabase: ReturnType<typeof createClient>): Promise<string> {
  for (let attempt = 0; attempt < 10; attempt += 1) {
    const seedPhrase = generateSeedPhrase();
    const seedHash = await hashValue(seedPhrase);

    const { data: existingSeed, error } = await supabase
      .from("app_users")
      .select("id")
      .eq("seed_hash", seedHash)
      .maybeSingle();

    if (error) {
      console.error("Seed uniqueness check error:", error);
      throw new Error("seed_check_failed");
    }

    if (!existingSeed) {
      return seedPhrase;
    }
  }

  throw new Error("seed_generation_failed");
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const payload = await req.json();

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    if (payload?.action === "generate_seed") {
      const seedPhrase = await generateUniqueSeedPhrase(supabase);

      return new Response(
        JSON.stringify({
          success: true,
          seed_phrase: seedPhrase,
          message: "Phrase de récupération générée",
        }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const username = typeof payload?.username === "string" ? payload.username : "";
    const password = typeof payload?.password === "string" ? payload.password : "";
    const seedPhrase = typeof payload?.seed_phrase === "string" ? payload.seed_phrase : "";
    const telegramId = typeof payload?.telegram_id === "number" ? payload.telegram_id : null;

    if (!username || !password || !seedPhrase) {
      return new Response(
        JSON.stringify({ error: "Pseudo, mot de passe et phrase de récupération requis" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const normalizedUsername = username.toLowerCase().trim();
    if (normalizedUsername.length < 3 || normalizedUsername.length > 30) {
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

    const normalizedSeed = normalizeSeedPhrase(seedPhrase);
    const words = normalizedSeed.split(" ");
    if (words.length !== 16) {
      return new Response(
        JSON.stringify({ error: "La phrase de récupération doit contenir exactement 16 mots" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const { data: existingUsername, error: usernameCheckError } = await supabase
      .from("app_users")
      .select("id")
      .eq("username", normalizedUsername)
      .maybeSingle();

    if (usernameCheckError) {
      console.error("Username check error:", usernameCheckError);
      return new Response(
        JSON.stringify({ error: "Erreur lors de la vérification du pseudo" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (existingUsername) {
      return new Response(
        JSON.stringify({ error: "Ce pseudo est déjà pris" }),
        { status: 409, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const passwordHash = await hashValue(password);
    const seedHash = await hashValue(normalizedSeed);

    const { data: existingSeed, error: seedCheckError } = await supabase
      .from("app_users")
      .select("id")
      .eq("seed_hash", seedHash)
      .maybeSingle();

    if (seedCheckError) {
      console.error("Seed check error:", seedCheckError);
      return new Response(
        JSON.stringify({ error: "Erreur lors de la vérification de la phrase" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (existingSeed) {
      return new Response(
        JSON.stringify({ error: "Cette phrase de récupération est déjà utilisée" }),
        { status: 409, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const insertPayload: {
      username: string;
      password_hash: string;
      seed_hash: string;
      telegram_id?: number;
    } = {
      username: normalizedUsername,
      password_hash: passwordHash,
      seed_hash: seedHash,
    };

    if (typeof telegramId === "number") {
      insertPayload.telegram_id = telegramId;
    }

    const { error: insertError } = await supabase.from("app_users").insert(insertPayload);

    if (insertError) {
      console.error("Insert error:", insertError);
      return new Response(
        JSON.stringify({ error: "Erreur lors de la création du compte" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    return new Response(
      JSON.stringify({
        success: true,
        message: "Compte créé avec succès",
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
