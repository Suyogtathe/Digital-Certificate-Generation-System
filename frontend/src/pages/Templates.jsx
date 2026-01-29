import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { fetchTemplates } from "../api/templateAPI";

export default function Templates() {
  const [templates, setTemplates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const loadTemplates = async () => {
      try {
        const data = await fetchTemplates();
        setTemplates(data);
      } catch (err) {
        setError("Unable to load templates");
      } finally {
        setLoading(false);
      }
    };

    loadTemplates();
  }, []);

  if (loading) {
    return (
      <div className="p-8 text-center text-gray-600 text-lg">
        Loading templates...
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-8 text-center text-red-600 font-semibold">
        {error}
      </div>
    );
  }

  return (
    <div className="py-12">
      <div className="max-w-7xl mx-auto px-8">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-3">Certificate Templates</h1>
          <p className="text-gray-600">
            Choose a professionally designed template to get started. All templates are fully customizable.
          </p>
        </div>

        {/* Templates Grid */}
        <div className="grid gap-8 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
          {templates.map((template) => (
            <div
              key={template._id}
              className="bg-white rounded-2xl shadow-md hover:shadow-xl transition-all duration-300 overflow-hidden transform hover:-translate-y-2 group"
            >
              {/* Template Preview with FREE badge */}
              <div className="h-48 bg-gray-100 overflow-hidden relative">
                {template.bgImageUrl && (
                  <img
                    src={`${import.meta.env.VITE_API_URL || 'http://localhost:4000'}${template.bgImageUrl}`}
                    alt={template.name}
                    className="object-cover h-full w-full opacity-60 grayscale-[30%] group-hover:opacity-100 group-hover:grayscale-0 transform group-hover:scale-110 transition-all duration-500 ease-out"
                  />
                )}
                {/* FREE Badge - Green without shadow */}
                <div className="absolute top-3 right-3 bg-green-600 text-white px-3 py-1 rounded-full text-xs font-bold uppercase">
                  Free
                </div>
              </div>

              {/* Template Info */}
              <div className="p-6">
                <h2 className="text-xl font-bold text-gray-900 mb-2">
                  {template.name}
                </h2>

                <p className="text-gray-600 text-sm mb-6">
                  {template.description || "Professional Standard Template"}
                </p>

                {/* Select Button */}
                <Link
                  to={`/dashboard/generate?templateId=${template._id}`}
                  className="block text-center py-3 rounded-xl font-semibold text-white bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 transition-all shadow-md hover:shadow-lg"
                >
                  Select Template
                </Link>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
