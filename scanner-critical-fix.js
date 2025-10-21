/**
 * CRITICAL FIX för Enhanced Scanner Core
 * Detta script MÅSTE köras EFTER core laddats men FÖRE scanning
 * 
 * PROBLEM SOM FIXAS:
 * 1. Kontaktformulär visas inte (timing-problem)
 * 2. CTA visar fel text
 * 3. Rapport analyseras inte innan modal visas
 */

(function() {
    'use strict';
    
    console.log('🔧 Loading CRITICAL FIX for Scanner Core...');
    
    // Vänta på att EnhancedScanner finns
    function waitForScanner(callback) {
        if (window.EnhancedScanner && window.ScannerUI) {
            callback();
        } else {
            setTimeout(() => waitForScanner(callback), 100);
        }
    }
    
    waitForScanner(function() {
        console.log('✅ Scanner detected, applying fixes...');
        
        // BACKUP av original funktioner
        const originalHandleScanSubmit = window.EnhancedScanner.handleScanSubmit;
        const originalProcessResults = window.EnhancedScanner.processAccessiBeResults;
        const originalShowCTA = window.ScannerUI.showCTAOverlay;
        
        // FIX 1: Uppdatera config för bättre timing
        window.EnhancedScanner.config.reportAnalysisDelay = 5000; // 5 sekunder
        window.EnhancedScanner.config.contactPopupTiming = "onReportAnalysis"; // Visa formulär efter analys
        window.EnhancedScanner.config.enableCTAOverlay = true; // CTA ska visas
        
        console.log('✅ Config updated:', window.EnhancedScanner.config);
        
        // FIX 2: Överskrid handleScanSubmit för att säkerställa rätt flöde
        window.EnhancedScanner.handleScanSubmit = function(e, form, formType, urlField) {
            console.log('🔄 FIXED handleScanSubmit triggered');
            
            // Kör original först
            const result = originalHandleScanSubmit.call(this, e, form, formType, urlField);
            
            // Efter 5 sekunder, tvinga visa kontaktformulär
            setTimeout(() => {
                console.log('⏰ 5 seconds elapsed, checking if contact modal should be shown...');
                
                // Kontrollera om modal redan visas
                const contactModal = document.getElementById('contactModal');
                if (contactModal && contactModal.style.display !== 'block') {
                    console.log('🔔 Forcing contact modal to show...');
                    
                    // Visa analyzing state först
                    if (window.ScannerUI) {
                        window.ScannerUI.showContactModal(true); // true = visa "Analyserar..."
                        
                        // Efter 2 sekunder, visa formuläret
                        setTimeout(() => {
                            console.log('📋 Showing contact form...');
                            window.ScannerUI.showContactModal(false, this.session);
                        }, 2000);
                    }
                }
            }, 5000);
            
            return result;
        };
        
        // FIX 3: Förbättra processAccessiBeResults för att ALLTID trigga modal
        window.EnhancedScanner.processAccessiBeResults = function(data) {
            console.log('🔍 FIXED processAccessiBeResults triggered');
            
            // Kör original
            originalProcessResults.call(this, data);
            
            // TVINGA visa kontaktformulär efter 1 sekund
            setTimeout(() => {
                console.log('📋 Forcing contact modal display after results processed');
                
                if (window.ScannerUI) {
                    window.ScannerUI.showContactModal(false, this.session);
                }
            }, 1000);
        };
        
        // FIX 4: Förbättra CTA för att visa rätt text
        window.ScannerUI.showCTAOverlay = function(sessionData) {
            console.log('🎯 FIXED showCTAOverlay triggered with data:', sessionData);
            
            const overlay = document.getElementById('ctaOverlay');
            if (!overlay) {
                console.warn('❌ CTA overlay element not found');
                return;
            }
            
            // Bestäm compliance status
            const status = sessionData?.complianceStatus || 'unknown';
            const issuesCount = sessionData?.issuesCount || 0;
            const domain = sessionData?.domain || 'din webbplats';
            
            console.log('📊 Compliance:', status, 'Issues:', issuesCount);
            
            // Skapa rätt innehåll baserat på status
            let ctaHTML = '';
            
            if (status === 'compliant' || status === 'accessible') {
                // GRÖN - Accessible
                ctaHTML = `
                    <button class="cta-minimize-btn" onclick="this.parentElement.classList.toggle('minimized')">−</button>
                    <div class="cta-header" style="display: flex; align-items: center; margin-bottom: 15px;">
                        <div style="background: #4CAF50; width: 50px; height: 50px; border-radius: 50%; display: flex; align-items: center; justify-content: center; margin-right: 15px;">
                            <span style="font-size: 28px; color: white;">✓</span>
                        </div>
                        <div>
                            <h3 style="margin: 0; color: white; font-size: 20px;">Bra jobbat!</h3>
                            <p style="margin: 0; color: rgba(255,255,255,0.9); font-size: 14px;">Din webbplats uppfyller tillgänglighetskraven</p>
                        </div>
                    </div>
                    <div class="cta-content">
                        <p style="color: rgba(255,255,255,0.9); margin-bottom: 20px; font-size: 15px;">
                            Vill du säkerställa att din webbplats förblir tillgänglig? Vi hjälper dig att bibehålla och förbättra tillgängligheten.
                        </p>
                        <div style="display: flex; gap: 12px; flex-wrap: wrap;">
                            <a href="https://www.selma.se/boka-demo" 
                               onclick="if(window.ScannerTracking) window.ScannerTracking.trackConversion('demo_click', {source: 'cta_banner', website: '${domain}'});"
                               style="flex: 1; min-width: 140px; padding: 12px 24px; background: white; color: #0a2460; border-radius: 6px; text-decoration: none; font-weight: 600; text-align: center; transition: all 0.2s;">
                                Boka demo →
                            </a>
                            <a href="https://www.selma.se/kontakt" 
                               onclick="if(window.ScannerTracking) window.ScannerTracking.trackConversion('contact_click', {source: 'cta_banner', website: '${domain}'});"
                               style="flex: 1; min-width: 140px; padding: 12px 24px; background: rgba(255,255,255,0.2); color: white; border: 1px solid white; border-radius: 6px; text-decoration: none; font-weight: 600; text-align: center; transition: all 0.2s;">
                                Kontakta oss
                            </a>
                        </div>
                    </div>
                `;
            } else {
                // RÖD/ORANGE - Not Accessible
                ctaHTML = `
                    <button class="cta-minimize-btn" onclick="this.parentElement.classList.toggle('minimized')">−</button>
                    <div class="cta-header" style="display: flex; align-items: center; margin-bottom: 15px;">
                        <div style="background: #f44336; width: 50px; height: 50px; border-radius: 50%; display: flex; align-items: center; justify-content: center; margin-right: 15px;">
                            <span style="font-size: 28px; color: white;">!</span>
                        </div>
                        <div>
                            <h3 style="margin: 0; color: white; font-size: 20px;">Tillgänglighetsförbättringar behövs</h3>
                            <p style="margin: 0; color: rgba(255,255,255,0.9); font-size: 14px;">${issuesCount > 0 ? issuesCount + ' problem hittades på ' + domain : 'Din webbplats behöver förbättras'}</p>
                        </div>
                    </div>
                    <div class="cta-content">
                        <p style="color: rgba(255,255,255,0.9); margin-bottom: 20px; font-size: 15px;">
                            Vill du göra din webbplats tillgänglig och följa EAA-direktivet? Vi hjälper dig att åtgärda problemen och bli compliant.
                        </p>
                        <div style="display: flex; gap: 12px; flex-wrap: wrap;">
                            <a href="https://www.selma.se/boka-demo" 
                               onclick="if(window.ScannerTracking) window.ScannerTracking.trackConversion('demo_click', {source: 'cta_banner', website: '${domain}'});"
                               style="flex: 1; min-width: 140px; padding: 12px 24px; background: white; color: #0a2460; border-radius: 6px; text-decoration: none; font-weight: 600; text-align: center; transition: all 0.2s;">
                                Boka demo →
                            </a>
                            <a href="https://www.selma.se/kontakt" 
                               onclick="if(window.ScannerTracking) window.ScannerTracking.trackConversion('contact_click', {source: 'cta_banner', website: '${domain}'});"
                               style="flex: 1; min-width: 140px; padding: 12px 24px; background: rgba(255,255,255,0.2); color: white; border: 1px solid white; border-radius: 6px; text-decoration: none; font-weight: 600; text-align: center; transition: all 0.2s;">
                                Kontakta oss
                            </a>
                        </div>
                    </div>
                `;
            }
            
            overlay.innerHTML = ctaHTML;
            overlay.style.display = 'block';
            
            // Track display
            if (window.ScannerTracking) {
                window.ScannerTracking.trackEvent('cta_overlay_displayed', {
                    compliance_status: status,
                    issues_count: issuesCount,
                    website: domain
                });
            }
            
            console.log('✅ CTA overlay displayed with correct content for status:', status);
        };
        
        // FIX 5: Lägg till event listener för när rapporten laddas
        window.addEventListener('message', function(event) {
            if (event.origin === window.EnhancedScanner.config.aceUrl) {
                console.log('📨 Message received from AccessiBe iframe');
                
                // Efter att rapporten tagits emot, vänta lite och visa formulär
                setTimeout(() => {
                    const contactModal = document.getElementById('contactModal');
                    if (contactModal && contactModal.style.display !== 'block') {
                        console.log('📋 Showing contact modal after iframe message');
                        if (window.ScannerUI) {
                            window.ScannerUI.showContactModal(false, window.EnhancedScanner.session);
                        }
                    }
                }, 3000);
            }
        });
        
        // FIX 6: Övervaka när contact form submittas
        document.addEventListener('submit', function(e) {
            const form = e.target;
            if (form.id === 'contactForm') {
                console.log('📤 Contact form submitted, will show CTA after report');
                
                // Efter submit, vänta och visa CTA
                setTimeout(() => {
                    if (window.ScannerUI && window.EnhancedScanner.session) {
                        console.log('🎯 Showing CTA after contact form submission');
                        window.ScannerUI.showCTAOverlay(window.EnhancedScanner.session);
                    }
                }, 3000);
            }
        });
        
        console.log('✅ ALL FIXES APPLIED SUCCESSFULLY!');
        console.log('📋 Contact modal will now show after 5 seconds');
        console.log('🎯 CTA will show correct text based on compliance status');
    });
    
})();
