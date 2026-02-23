import { TemplateService } from "@/application/services/TemplateService";
import { LocalStorageTemplateRepository } from "@/infrastructure/repositories/LocalStorageTemplateRepository";
import { MockTemplateRepository } from "@/infrastructure/repositories/MockTemplateRepository";
import { ApiTemplateRepository } from "@/infrastructure/repositories/ApiTemplateRepository";

// Service for Client-Side Dashboard (uses LocalStorage)
export const localTemplateService = new TemplateService(
  new LocalStorageTemplateRepository()
);

// Service for Server-Side Rendering (uses Mock Data)
// Note: This service instance should only be used in Server Components or API Routes
export const serverTemplateService = new TemplateService(
  new MockTemplateRepository()
);

// Service for Client-Side Public Views (uses API Route to access Server Data)
export const apiTemplateService = new TemplateService(
  new ApiTemplateRepository()
);
