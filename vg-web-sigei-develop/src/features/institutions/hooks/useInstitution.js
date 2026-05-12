import { useState, useCallback } from "react";
import { institutionService } from "../services/institutionService";
import { parseInstitutionFromApi } from "../models/institutionModel";
import {
     alertApiError,
     alertUpdated,
} from "@/shared/components/feedback";
import { extractData, isSuccessResponse } from "@/core/api/apiResponse";

export function useInstitution() {
     const [institution, setInstitution] = useState(null);
     const [loading, setLoading] = useState(false);
     const [error, setError] = useState(null);

     const fetchById = useCallback(async (id) => {
          setLoading(true);
          setError(null);
          try {
               const response = await institutionService.getById(id);
               const raw = isSuccessResponse(response) ? extractData(response) : response;
               const data = parseInstitutionFromApi(raw);
               setInstitution(data);
               return data;
          } catch (err) {
               setError(err);
               alertApiError(err);
          } finally {
               setLoading(false);
          }
     }, []);

     const updateInstitution = useCallback(async (id, payload) => {
          const response = await institutionService.update(id, payload);
          alertUpdated("Institución");
          return response;
     }, []);

     return {
          institution,
          loading,
          error,
          fetchById,
          updateInstitution,
     };
}
