import { onRequestPost as __api_auth0_check_email_js_onRequestPost } from "D:\\PTM\\PTMProjects\\fullstack_application\\kfc_microservice-irb\\KFC_Micro_service\\Frontend\\functions\\api\\auth0\\check-email.js"
import { onRequestPost as __api_auth0_token_js_onRequestPost } from "D:\\PTM\\PTMProjects\\fullstack_application\\kfc_microservice-irb\\KFC_Micro_service\\Frontend\\functions\\api\\auth0\\token.js"

export const routes = [
    {
      routePath: "/api/auth0/check-email",
      mountPath: "/api/auth0",
      method: "POST",
      middlewares: [],
      modules: [__api_auth0_check_email_js_onRequestPost],
    },
  {
      routePath: "/api/auth0/token",
      mountPath: "/api/auth0",
      method: "POST",
      middlewares: [],
      modules: [__api_auth0_token_js_onRequestPost],
    },
  ]