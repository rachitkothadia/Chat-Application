const NoChatSelected = () => {
  return (
    <div className="w-full flex flex-1 flex-col items-center justify-center p-16 bg-base-100/50">
      <div className="max-w-md text-center space-y-6">
        {/* Icon Display */}
        <div className="flex justify-center gap-4 mb-4">
          <div className="relative">
            <div
              className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center
             justify-center animate-bounce">
               <img
                  src="/SecureChat Logo.png"
                  alt="SecureChat Logo"
                  className="w-15 h-15"
                  onError={(e) => {
                    e.currentTarget.src = "https://res.cloudinary.com/dzlsiekwa/image/upload/v1736620593/SecureChat_Logo_ntx47p.png";
                    e.currentTarget.onerror = null; // Prevent infinite loop if Cloudinary URL also fails
                  }}
                />
            </div>
          </div>
        </div>

        {/* Welcome Text */}
        <h2 className="text-2xl font-bold">Welcome to SecureChat!</h2>
        <p className="text-base-content/60">
          Connect with your Loved Ones 💕
        </p>
      </div>
    </div>
  );
};

export default NoChatSelected;
