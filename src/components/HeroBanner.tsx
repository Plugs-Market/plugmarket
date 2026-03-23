const HeroBanner = () => {
  return (
    <div className="w-full bg-secondary py-10 px-4 flex flex-col items-center justify-center gap-2">
      <h1 className="font-display text-3xl sm:text-4xl md:text-5xl font-black tracking-wider neon-text">
        PLUGS MARKET
      </h1>
      <p className="text-muted-foreground text-xs sm:text-sm tracking-widest uppercase">
        APP DEMO
      </p>
    </div>
  );
};

export default HeroBanner;
