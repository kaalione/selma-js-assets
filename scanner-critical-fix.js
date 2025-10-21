/**
 * CRITICAL FIX för Enhanced Scanner Core v2.0
 * Fixar: Contact form timing, CTA text, rapport analys
 * 
 * DETTA SCRIPT MÅSTE KÖRAS EFTER ALLA MODULER LADDATS
 */

(function() {
    'use strict';
    
    console.log('🔧 Loading CRITICAL FIX v2.0 for Scanner...');
    
    // Vänta på att EnhancedScanner OCH ScannerUI finns
    function waitForScanner(callback) {
        if (window.EnhancedScanner && window.ScannerUI) {
            console.log('✅ Scanner and UI detected, applying fixes...');
            callback();
        } else {
            const missing = [];
            if (!window.EnhancedScanner) missing.push('EnhancedScanner');
            if (!window.ScannerUI) missing.push('ScannerUI');
            console.log(`⏳ Waiting for: ${missing.join(', ')}`);
            setTimeout(() => waitForScanner(callback), 100);
        }
    }
    
    waitForScanner(function() {
        console.log('🔧 Applying critical fixes...');
        
        // BACKUP av original funktioner
        const originalHandleScanSubmit = window.EnhancedScanner.handleScanSubmit;
        const originalProcessResults = window.EnhancedScanner.processAccessiBeResults;
        const originalShowCTA = window.ScannerUI.showCTAOverlay;
        const originalShowContactModal = window.ScannerUI.showContactModal;
        
        // FIX 1: Uppdatera config för bättre timing
        if (window.EnhancedScanner.config) {
            window.EnhancedScanner.config.reportAnalysisDelay = 5000; // 5 sekunder
            window.EnhancedScanner.config.contactPopupTiming = "onReportAnalysis";
            window.EnhancedScanner.config.enableCTAOverlay = true;
            console.log('✅ Config updated:', window.EnhancedScanner.config);
        }
        
        // FIX 2: Förbättrad handleScanSubmit med garanterad contact modal
        window.EnhancedScanner.handleScanSubmit = function(e, form, formType, urlField) {
            console.log('🔄 FIXED handleScanSubmit triggered');
            
            // Kör original först
            const result = originalHandleScanSubmit.call(this, e, form, formType, urlField);
            
            // Sätt upp timer för att tvinga visa kontaktformulär
            const contactTimer = setTimeout(() => {
                console.log('⏰ 5 seconds elapsed, checking contact modal...');
                
                const contactModal = document.getElementById('contactModal');
                if (contactModal && contactModal.style.display !== 'block') {
                    console.log('📋 Forcing contact modal to show...');
                    
                    if (window.ScannerUI && typeof window.ScannerUI.showContactModal === 'function') {
                        // Visa "Analyserar..." först
                        window.ScannerUI.showContactModal(true, this.session);
                        
                        // Efter 2 sekunder, visa formuläret
                        setTimeout(() => {
                            console.log('📝 Showing contact form...');
                            window.ScannerUI.showContactModal(false, this.session);
                        }, 2000);
                    }
                } else {
                    console.log('✅ Contact modal already showing');
                }
            }, 5000);
            
            // Spara timer reference
            this.session.contactTimer = contactTimer;
            
            return result;
        };
        
        // FIX 3: Förbättrad processAccessiBeResults
        window.EnhancedScanner.processAccessiBeResults = function(data) {
            console.log('📊 FIXED processAccessiBeResults triggered with data:', data);
            
            // Kör original
            if (originalProcessResults) {
                originalProcessResults.call(this, data);
            }
            
            // Uppdatera session med resultaten
            if (data) {
                this.session.reportLoaded = true;
                this.session.reportAnalyzed = true;
                
                // Extrahera compliance info
                if (data.complianceStatus) {
                    this.session.complianceStatus = data.complianceStatus;
                }
                if (data.issuesCount !== undefined) {
                    this.session.issuesCount = data.issuesCount;
                }
                
                console.log('✅ Session updated:', this.session);
            }
            
            // TVINGA visa kontaktformulär efter analys
            setTimeout(() => {
                console.log('📋 Forcing contact modal after results processed');
                
                const contactModal = document.getElementById('contactModal');
                if (!contactModal || contactModal.style.display !== 'block') {
                    if (window.ScannerUI && typeof window.ScannerUI.showContactModal === 'function') {
                        window.ScannerUI.showContactModal(false, this.session);
                    }
                }
            }, 1000);
        };
        
        // FIX 4: Förbättrad showCTAOverlay med korrekt text
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
            
            console.log('📊 Status:', status, '| Issues:', issuesCount, '| Domain:', domain);
            
            // Skapa rätt innehåll baserat på status
            let ctaHTML = '';
            let isCompliant = false;
            
            // Bestäm om sidan är compliant (använd lowercase för säkrare jämförelse)
            const statusLower = String(status).toLowerCase();
            if (statusLower === 'compliant' || statusLower === 'accessible' || statusLower === 'pass' || statusLower === 'passed') {
                isCompliant = true;
            } else if (issuesCount === 0 || issuesCount < 5) {
                isCompliant = true; // Om få issues, visa som compliant
            }
            
            if (isCompliant) {
                // GRÖN - Accessible
                ctaHTML = `
                    <button class="cta-minimize-btn" onclick="this.parentElement.classList.toggle('minimized')" aria-label="Minimera banner">−</button>
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
                               onclick="if(window.ScannerTracking) window.ScannerTracking.trackConversion('demo_click', {source: 'cta_banner', website: '${domain}', status: 'compliant'});"
                               style="flex: 1; min-width: 140px; padding: 12px 24px; background: white; color: #0a2460; border-radius: 6px; text-decoration: none; font-weight: 600; text-align: center; transition: all 0.2s;">
                                Boka demo →
                            </a>
                            <a href="https://www.selma.se/kontakt" 
                               onclick="if(window.ScannerTracking) window.ScannerTracking.trackConversion('contact_click', {source: 'cta_banner', website: '${domain}', status: 'compliant'});"
                               style="flex: 1; min-width: 140px; padding: 12px 24px; background: rgba(255,255,255,0.2); color: white; border: 1px solid white; border-radius: 6px; text-decoration: none; font-weight: 600; text-align: center; transition: all 0.2s;">
                                Kontakta oss
                            </a>
                        </div>
                    </div>
                `;
            } else {
                // RÖD/ORANGE - Not Accessible
                ctaHTML = `
                    <button class="cta-minimize-btn" onclick="this.parentElement.classList.toggle('minimized')" aria-label="Minimera banner">−</button>
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
                               onclick="if(window.ScannerTracking) window.ScannerTracking.trackConversion('demo_click', {source: 'cta_banner', website: '${domain}', status: 'non_compliant', issues: ${issuesCount}});"
                               style="flex: 1; min-width: 140px; padding: 12px 24px; background: white; color: #0a2460; border-radius: 6px; text-decoration: none; font-weight: 600; text-align: center; transition: all 0.2s;">
                                Boka demo →
                            </a>
                            <a href="https://www.selma.se/kontakt" 
                               onclick="if(window.ScannerTracking) window.ScannerTracking.trackConversion('contact_click', {source: 'cta_banner', website: '${domain}', status: 'non_compliant', issues: ${issuesCount}});"
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
            if (window.ScannerTracking && typeof window.ScannerTracking.trackEvent === 'function') {
                window.ScannerTracking.trackEvent('cta_overlay_displayed', {
                    compliance_status: status,
                    is_compliant: isCompliant,
                    issues_count: issuesCount,
                    website: domain
                });
            }
            
            console.log('✅ CTA overlay displayed with correct content | Compliant:', isCompliant);
        };
        
        // FIX 5: Lyssna på när rapporten faktiskt laddas i iframe
        window.addEventListener('message', function(event) {
            // Kontrollera att det är från AccessiBe
            if (event.origin === window.EnhancedScanner.config.aceUrl || 
                event.origin.includes('acsbace.com')) {
                console.log('📨 Message received from AccessiBe iframe:', event.data);
                
                // Efter att rapporten tagits emot, vänta lite och visa formulär
                setTimeout(() => {
                    const contactModal = document.getElementById('contactModal');
                    if (contactModal && contactModal.style.display !== 'block') {
                        console.log('📋 Showing contact modal after iframe message');
                        if (window.ScannerUI && typeof window.ScannerUI.showContactModal === 'function') {
                            window.ScannerUI.showContactModal(false, window.EnhancedScanner.session);
                        }
                    }
                }, 3000);
            }
        });
        
        // FIX 6: Övervaka när contact form submittas för att visa CTA
        document.addEventListener('submit', function(e) {
            const form = e.target;
            if (form.id === 'contactForm' || form.classList.contains('contact-form')) {
                console.log('📤 Contact form submitted, will show CTA after delay');
                
                // Efter submit, vänta och visa CTA
                setTimeout(() => {
                    if (window.ScannerUI && window.EnhancedScanner.session) {
                        console.log('🎯 Showing CTA after contact form submission');
                        window.ScannerUI.showCTAOverlay(window.EnhancedScanner.session);
                    }
                }, 3000);
            }
        });
        
        // FIX 7: Failsafe - Om inget har hänt efter 10 sekunder, visa contact form
        setTimeout(() => {
            const contactModal = document.getElementById('contactModal');
            const enhancedModal = document.getElementById('enhancedModal') || document.getElementById('modal66f5d0180130eb9ebefb1233');
            
            // Endast visa om scanning modal är aktiv
            if (enhancedModal && enhancedModal.style.display === 'block') {
                if (!contactModal || contactModal.style.display !== 'block') {
                    console.log('⚠️ Failsafe: Forcing contact modal after 10 seconds');
                    if (window.ScannerUI && typeof window.ScannerUI.showContactModal === 'function') {
                        window.ScannerUI.showContactModal(false, window.EnhancedScanner.session);
                    }
                }
            }
        }, 10000);
        
        console.log('✅ ALL CRITICAL FIXES APPLIED SUCCESSFULLY!');
        console.log('📋 Contact modal will show after 5 seconds of scanning');
        console.log('🎯 CTA will show correct text based on compliance status');
        console.log('⚠️ Failsafe will trigger after 10 seconds if needed');
    });
    
})();
