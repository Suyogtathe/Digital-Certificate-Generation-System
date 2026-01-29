import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import API from "../api/axiosInstance";

export default function TemplatePreview() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [template, setTemplate] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const loadTemplate = async () => {
      try {
        const res = await API.get("/templates");
        const found = res.data.templates.find((t) => t._id === id);
        if (!found) setError("Template not found");
        else setTemplate(found);
      } catch {
        setError("Failed to load template");
      } finally {
        setLoading(false);
      }
    };
    loadTemplate();
  }, [id]);

  if (loading) {
    return <div className="p-8 text-center">Loading template...</div>;
  }

  if (error) {
    return <div className="p-8 text-center text-red-600">{error}</div>;
  }

  return (
    <div className="p-8 max-w-5xl mx-auto">
      <div className="w-full h-[420px] bg-gray-100 rounded-xl overflow-hidden shadow">
        <img
          src={`http://localhost:4000/${template.bgImageUrl}`}
          alt={template.name}
          className="w-full h-full object-cover"
        />
      </div>

      <div className="mt-8 bg-white p-6 rounded-xl shadow">
        <h1 className="text-3xl font-bold mb-2">{template.name}</h1>
        <p className="text-gray-600 mb-4">{template.description}</p>

        {/* ALL TEMPLATES ARE FREE */}
        <span className="inline-block mb-6 px-4 py-1 rounded-full bg-green-100 text-green-600 font-semibold">
          Free Template
        </span>

        <button
          onClick={() =>
            navigate(`/dashboard/generate?templateId=${template._id}`)
          }
          className="px-6 py-3 bg-blue-600 text-white rounded-lg"
        >
          Use this Template
        </button>
      </div>
    </div>
  );
}
