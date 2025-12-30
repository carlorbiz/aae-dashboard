"""
API Integration Examples for DocsAutomator and Gamma.app
Demonstrates how to integrate these services into MCP workflows
"""

import requests
import json
import time
from typing import Dict, List, Optional, Any


# ============================================================================
# DOCSAUTOMATOR API INTEGRATION
# ============================================================================

class DocsAutomatorAPI:
    """
    Wrapper for DocsAutomator API
    Documentation: https://docs.docsautomator.co/integrations-api/docsautomator-api
    """
    
    def __init__(self, api_key: str):
        self.base_url = "https://api.docsautomator.co"
        self.headers = {
            "Authorization": f"Bearer {api_key}",
            "Content-Type": "application/json"
        }
    
    def create_document(
        self,
        doc_id: str,
        data: Dict[str, Any],
        document_name: Optional[str] = None
    ) -> Dict[str, str]:
        """
        Create a document from a template
        
        Args:
            doc_id: The automation/template ID
            data: Dictionary of placeholder values
            document_name: Optional name for the generated document
            
        Returns:
            Dictionary with pdfUrl, googleDocUrl, and savePdfGoogleDriveFolderId
        """
        endpoint = f"{self.base_url}/createDocument"
        
        payload = {
            "docId": doc_id,
            "data": data
        }
        
        if document_name:
            payload["documentName"] = document_name
        
        response = requests.post(endpoint, headers=self.headers, json=payload)
        response.raise_for_status()
        
        return response.json()
    
    def list_automations(self) -> List[Dict[str, Any]]:
        """
        List all automations/templates in workspace
        
        Returns:
            List of automation objects
        """
        endpoint = f"{self.base_url}/automations"
        
        response = requests.get(endpoint, headers=self.headers)
        response.raise_for_status()
        
        return response.json().get("automations", [])
    
    def update_automation(
        self,
        doc_id: str,
        updates: Dict[str, Any]
    ) -> Dict[str, Any]:
        """
        Update an automation's settings
        
        Args:
            doc_id: The automation ID
            updates: Dictionary of fields to update
            
        Returns:
            Updated automation object
        """
        endpoint = f"{self.base_url}/updateAutomation"
        params = {"docId": doc_id}
        
        response = requests.put(
            endpoint,
            headers=self.headers,
            params=params,
            json=updates
        )
        response.raise_for_status()
        
        return response.json()


# ============================================================================
# GAMMA.APP API INTEGRATION
# ============================================================================

class GammaAPI:
    """
    Wrapper for Gamma.app API
    Documentation: https://developers.gamma.app/docs/getting-started
    """
    
    def __init__(self, api_key: str):
        self.base_url = "https://public-api.gamma.app/v1.0"
        self.headers = {
            "X-API-KEY": api_key,
            "Content-Type": "application/json",
            "accept": "application/json"
        }
    
    def generate_gamma(
        self,
        input_text: str,
        text_mode: str = "generate",
        format: str = "presentation",
        num_cards: int = 10,
        theme_id: Optional[str] = None,
        additional_instructions: Optional[str] = None,
        export_as: Optional[str] = None,
        text_options: Optional[Dict] = None,
        image_options: Optional[Dict] = None,
        folder_ids: Optional[List[str]] = None
    ) -> str:
        """
        Generate a gamma (presentation, document, webpage, or social post)
        
        Args:
            input_text: Content to generate from (1-100,000 tokens)
            text_mode: "generate", "condense", or "preserve"
            format: "presentation", "document", "webpage", or "social"
            num_cards: Number of cards/slides (1-60 for Pro, 1-75 for Ultra)
            theme_id: Custom theme ID (optional)
            additional_instructions: Extra specifications (1-2000 chars)
            export_as: "pdf" or "pptx" for additional export formats
            text_options: Dictionary with language, tone, audience settings
            image_options: Dictionary with image model settings
            folder_ids: List of folder IDs to store the gamma
            
        Returns:
            generation_id: Use this to retrieve the generated gamma URLs
        """
        endpoint = f"{self.base_url}/generations"
        
        payload = {
            "inputText": input_text,
            "textMode": text_mode,
            "format": format,
            "numCards": num_cards
        }
        
        if theme_id:
            payload["themeId"] = theme_id
        if additional_instructions:
            payload["additionalInstructions"] = additional_instructions
        if export_as:
            payload["exportAs"] = export_as
        if text_options:
            payload["textOptions"] = text_options
        if image_options:
            payload["imageOptions"] = image_options
        if folder_ids:
            payload["folderIds"] = folder_ids
        
        response = requests.post(endpoint, headers=self.headers, json=payload)
        response.raise_for_status()
        
        result = response.json()
        return result.get("generationId")
    
    def get_generation_status(self, generation_id: str) -> Dict[str, Any]:
        """
        Get the status and URLs of a generated gamma
        
        Args:
            generation_id: The ID returned from generate_gamma()
            
        Returns:
            Dictionary with gamma URL, PDF URL, PPTX URL (if requested)
        """
        endpoint = f"{self.base_url}/generations/{generation_id}"
        
        response = requests.get(endpoint, headers=self.headers)
        response.raise_for_status()
        
        return response.json()
    
    def wait_for_generation(
        self,
        generation_id: str,
        max_wait: int = 300,
        poll_interval: int = 5
    ) -> Dict[str, Any]:
        """
        Wait for a gamma generation to complete
        
        Args:
            generation_id: The ID returned from generate_gamma()
            max_wait: Maximum seconds to wait (default: 300)
            poll_interval: Seconds between status checks (default: 5)
            
        Returns:
            Dictionary with gamma URL, PDF URL, PPTX URL (if requested)
        """
        elapsed = 0
        while elapsed < max_wait:
            try:
                result = self.get_generation_status(generation_id)
                
                # Check if generation is complete
                status = result.get("status", "")
                if status == "completed":
                    return result
                elif status == "failed":
                    raise Exception(f"Generation failed: {result.get('error', 'Unknown error')}")
                
            except requests.exceptions.HTTPError as e:
                if e.response.status_code != 404:
                    raise
            
            time.sleep(poll_interval)
            elapsed += poll_interval
        
        raise TimeoutError(f"Generation did not complete within {max_wait} seconds")
    
    def list_themes(self) -> List[Dict[str, Any]]:
        """
        List available themes
        
        Returns:
            List of theme objects with IDs and names
        """
        endpoint = f"{self.base_url}/themes"
        
        response = requests.get(endpoint, headers=self.headers)
        response.raise_for_status()
        
        return response.json()
    
    def list_folders(self) -> List[Dict[str, Any]]:
        """
        List available folders
        
        Returns:
            List of folder objects with IDs and names
        """
        endpoint = f"{self.base_url}/folders"
        
        response = requests.get(endpoint, headers=self.headers)
        response.raise_for_status()
        
        return response.json()


# ============================================================================
# WORKFLOW INTEGRATION EXAMPLES
# ============================================================================

def example_workflow_notion_to_docsautomator_to_notion():
    """
    Example: Extract content from Notion → Create Google Doc → Save URL to Notion

    This demonstrates the workflow you originally asked about.
    """

    # Initialize APIs
    # Get API key from environment or configuration
    import os
    docsautomator_key = os.getenv("DOCSAUTOMATOR_API_KEY", "your-api-key-here")
    docs_api = DocsAutomatorAPI(api_key=docsautomator_key)
    
    # Step 1: Extract content from Notion (via Notion MCP)
    # This would be done using: manus-mcp-cli tool call notion-fetch --server notion
    notion_content = {
        "title": "MCP Integration Guide",
        "content": "This is the content extracted from Notion...",
        "author": "Manus AI",
        "date": "2025-12-27"
    }
    
    # Step 2: Create Google Doc using DocsAutomator
    print("Creating document with DocsAutomator...")
    
    # First, list automations to find the right template
    automations = docs_api.list_automations()
    print(f"Found {len(automations)} automations")
    
    # Use the first automation (or find by name)
    if automations:
        doc_id = automations[0]["_id"]
        
        # Prepare data for template placeholders
        template_data = {
            "title": notion_content["title"],
            "content": notion_content["content"],
            "author": notion_content["author"],
            "date": notion_content["date"]
        }
        
        # Create the document
        result = docs_api.create_document(
            doc_id=doc_id,
            data=template_data,
            document_name=f"{notion_content['title']} - {notion_content['date']}"
        )
        
        print(f"Document created!")
        print(f"PDF URL: {result['pdfUrl']}")
        print(f"Google Doc URL: {result['googleDocUrl']}")
        
        # Step 3: Save URL to Notion (via Notion MCP)
        # This would be done using: manus-mcp-cli tool call notion-update-page --server notion
        print(f"\nNow update Notion with URL: {result['googleDocUrl']}")
        
        return result
    else:
        print("No automations found. Please create a template in DocsAutomator first.")
        return None


def example_workflow_notion_to_gamma_presentation():
    """
    Example: Extract content from Notion → Create Gamma presentation → Save URL to Notion
    """

    # Initialize API
    # Get API key from environment or configuration
    import os
    gamma_key = os.getenv("GAMMA_API_KEY", "your-api-key-here")
    gamma_api = GammaAPI(api_key=gamma_key)
    
    # Step 1: Extract content from Notion (via Notion MCP)
    notion_content = """
    # MCP Integration Strategy
    
    ## Overview
    Multi-Cloud Platform integrations enable seamless workflows across tools.
    
    ## Key Benefits
    - Automated document generation
    - Cross-platform data synchronization
    - AI-powered content creation
    
    ## Implementation
    Use APIs to connect Notion, DocsAutomator, and Gamma.app for end-to-end automation.
    """
    
    # Step 2: Create Gamma presentation
    print("Creating presentation with Gamma.app...")
    
    generation_id = gamma_api.generate_gamma(
        input_text=notion_content,
        text_mode="generate",
        format="presentation",
        num_cards=8,
        additional_instructions="Make it professional and visually appealing",
        export_as="pdf",
        text_options={
            "tone": "professional",
            "audience": "technical team"
        }
    )
    
    print(f"Generation started: {generation_id}")
    print("Waiting for completion...")
    
    # Wait for generation to complete
    result = gamma_api.wait_for_generation(generation_id, max_wait=180)
    
    print(f"\nPresentation created!")
    print(f"Gamma URL: {result.get('gammaUrl')}")
    print(f"PDF URL: {result.get('pdfUrl')}")
    
    # Step 3: Save URL to Notion (via Notion MCP)
    print(f"\nNow update Notion with URL: {result.get('gammaUrl')}")
    
    return result


def example_combined_workflow():
    """
    Example: Create both a document and presentation from the same Notion content
    """

    # Initialize both APIs
    # Get API keys from environment or configuration
    import os
    docsautomator_key = os.getenv("DOCSAUTOMATOR_API_KEY", "your-api-key-here")
    gamma_key = os.getenv("GAMMA_API_KEY", "your-api-key-here")
    docs_api = DocsAutomatorAPI(api_key=docsautomator_key)
    gamma_api = GammaAPI(api_key=gamma_key)
    
    # Extract content from Notion
    notion_content = "Your comprehensive content here..."
    
    print("Creating document and presentation in parallel...")
    
    # Start both generations
    # 1. DocsAutomator for detailed document
    automations = docs_api.list_automations()
    if automations:
        doc_result = docs_api.create_document(
            doc_id=automations[0]["_id"],
            data={"content": notion_content}
        )
        print(f"Document: {doc_result['googleDocUrl']}")
    
    # 2. Gamma for presentation
    generation_id = gamma_api.generate_gamma(
        input_text=notion_content,
        format="presentation",
        export_as="pptx"
    )
    gamma_result = gamma_api.wait_for_generation(generation_id)
    print(f"Presentation: {gamma_result.get('gammaUrl')}")
    
    # Update Notion with both URLs
    print("\nUpdate Notion AI Agent Universal Conversations database with:")
    print(f"- Document URL: {doc_result.get('googleDocUrl')}")
    print(f"- Presentation URL: {gamma_result.get('gammaUrl')}")
    print(f"- PPTX URL: {gamma_result.get('pptxUrl')}")
    
    return {
        "document": doc_result,
        "presentation": gamma_result
    }


# ============================================================================
# MAIN EXECUTION
# ============================================================================

if __name__ == "__main__":
    print("=" * 80)
    print("API Integration Examples")
    print("=" * 80)
    
    print("\n1. Testing DocsAutomator API...")
    print("-" * 80)
    # Uncomment to test:
    # example_workflow_notion_to_docsautomator_to_notion()
    
    print("\n2. Testing Gamma.app API...")
    print("-" * 80)
    # Uncomment to test:
    # example_workflow_notion_to_gamma_presentation()
    
    print("\n3. Testing Combined Workflow...")
    print("-" * 80)
    # Uncomment to test:
    # example_combined_workflow()
    
    print("\nNote: Uncomment the function calls above to run actual API tests.")
    print("Make sure you have valid automation IDs and templates set up first.")
