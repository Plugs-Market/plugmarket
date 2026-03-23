import logo from "@/assets/logo.png";

const HeroBanner = () => {
  return (
    <div className="w-full bg-secondary py-8 px-4 flex items-center justify-center">
      <img
        src={logo}
        alt="All Farmz"
        width={800}
        height={512}
        className="w-48 sm:w-64 md:w-80 h-auto"
      />
    </div>
  );
};

export default HeroBanner;
