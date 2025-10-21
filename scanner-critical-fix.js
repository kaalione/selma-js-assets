/**
 * CRITICAL FIX för Enhanced Scanner Core v3.0 - KORRIGERAD
 * Fixar: Contact form timing, CTA text, rapport analys
 * 
 * VIKTIGT: Detta script sparar BACKUPS och återställer funktionerna korrekt
 */

(function() {
    'use strict';
    
    console.log('🔧 Loading CRITICAL FIX v3.0 for Scanner...');
    
    // Vänta på att EnhancedScanner OCH ScannerUI finns
    function waitForScanner(callback, attempts = 0) {
        if (attempts > 50) {
            console.error('❌ Timeout: Scanner modules did not load');
            return;
        }
        
        if (window.EnhancedScanner && window.ScannerUI) {
            console.log('✅ Scanner and UI detected, applying fixes...');
            callback();
        } else {
            const missing = [];
            if (!window.EnhancedScanner) missing.push('EnhancedScanner');
            if (!window.ScannerUI) missing.push('ScannerUI');
            console.log(`⏳ Waiting for: ${missing.join(', ')} (attempt ${attempts + 1}/50)`);
            setTimeout(() => waitForScanner(callback, attempts + 1), 100);
        }
    }
    
    waitForScanner(function() {
        console.log('🔧 Applying critical fixes...');
        
        // SPARA REFERENSER - detta är KRITISKT!
        const Scanner = window.EnhancedScanner;
        const UI = window.ScannerUI;
        
        // BACKUP av original funktioner
        const originalHandleScanSubmit = Scanner.handleScanSubmit;
        const originalProcessResults = Scanner.processAccessiBeResults;
        const originalShowCTA = UI.showCTAOverlay;
        
        // Verifiera att vi har funktionerna
        if (!originalHandleScanSubmit || !originalProcessResults || !originalShowCTA) {
            console.error('❌ Critical functions not found!', {
                handleScanSubmit: !!originalHandleScanSubmit,
                processAccessiBeResults: !!originalProcessResults,
                showCTAOverlay: !!originalShowCTA
            });
            return;
        }
        
        // FIX 1: Uppdatera config
        if (Scanner.config) {
            Scanner.config.reportAnalysisDelay = 5000;
            Scanner.config.contactPopupTiming = "onReportAnalysis";
            Scanner.config.enableCTAOverlay = true;
            console.log('✅ Config updated:', {
                reportAnalysisDelay: Scanner.config.reportAnalysisDelay,
                contactPopupTiming: Scanner.config.contactPopupTiming,
                enableCTAOverlay: Scanner.config.enableCTAOverlay
            });
        }
        
        // FIX 2: Förbättrad handleScanSubmit MED 5-sekunders timer
        Scanner.handleScanSubmit = function(e, form, formType, urlField) {
            console.log('🔄 FIXED handleScanSubmit triggered');
            
            // Kör original först
            const result = originalHandleScanSubmit.call(this, e, form, formType, urlField);
            
            // Sätt upp timer för att visa kontaktformulär
            const contactTimer = setTimeout(() => {
                console.log('⏰ 5 seconds elapsed, checking contact modal...');
                
                const contactModal = document.getElementById('contactModal');
                if (contactModal && contactModal.style.display !== 'block') {
                    console.log('📋 Forcing contact modal to show...');
                    
                    if (UI && typeof UI.showContactModal === 'function') {
                        // Visa "Analyserar..." först
                        UI.showContactModal(true, this.session);
                        
                        // Efter 2 sekunder, visa formuläret
                        setTimeout(() => {
                            console.log('📝 Showing contact form...');
                            UI.showContactModal(false, this.session);
                        }, 2000);
                    }
                } else {
                    console.log('✅ Contact modal already showing');
                }
            }, 5000);
            
            // Spara timer reference
            if (this.session) {
                this.session.contactTimer = contactTimer;
            }
            
            return result;
        };
        
        // FIX 3: Förbättrad processAccessiBeResults
        Scanner.processAccessiBeResults = function(data) {
            console.log('📊 FIXED processAccessiBeResults triggered with data:', data);
            
            // Kör original
            if (originalProcessResults) {
                originalProcessResults.call(this, data);
            }
            
            // Uppdatera session med resultaten
            if (data && this.session) {
                this.session.reportLoaded = true;
                this.session.reportAnalyzed = true;
                
                // Extrahera compliance info från reports
                if (data.reports && data.reports.main) {
                    const mainReport = data.reports.main;
                    
                    // Bestäm compliance status
                    if (mainReport.violations) {
                        const violationCount = mainReport.violations.length || 0;
                        this.session.issuesCount = violationCount;
                        this.session.complianceStatus = violationCount === 0 ? 'compliant' : 'non_compliant';
                    }
                    
                    // Alternativ: kolla score
                    if (mainReport.score !== undefined) {
                        if (mainReport.score >= 90) {
                            this.session.complianceStatus = 'compliant';
                        } else {
                            this.session.complianceStatus = 'non_compliant';
                        }
                    }
                }
                
                console.log('✅ Session updated:', {
                    complianceStatus: this.session.complianceStatus,
                    issuesCount: this.session.issuesCount,
                    domain: this.session.domain
                });
            }
            
            // TVINGA visa kontaktformulär efter analys
            setTimeout(() => {
                console.log('📋 Forcing contact modal after results processed');
                
                const contactModal = document.getElementById('contactModal');
                if (!contactModal || contactModal.style.display !== 'block') {
                    if (UI && typeof UI.showContactModal === 'function') {
                        UI.showContactModal(false, this.session);
                    }
                }
            }, 1000);
        };
        
        // FIX 4: Förbättrad showCTAOverlay med KORREKT text-logik
        UI.showCTAOverlay = function(sessionData) {
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
            
            // Bestäm om sidan är compliant
            let isCompliant = false;
            const statusLower = String(status).toLowerCase();
            
            if (statusLower === 'compliant' || statusLower === 'accessible' || 
                statusLower === 'pass' || statusLower === 'passed') {
                isCompliant = true;
            } else if (statusLower === 'unknown' && issuesCount < 5) {
                // Om status är unknown men få issues, visa som compliant
                isCompliant = true;
            } else if (issuesCount === 0) {
                isCompliant = true;
            }
            
            // Skapa rätt innehåll
            let ctaHTML = '';
            
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
                               style="flex: 1; min-width: 140px; padding: 12px 24px; background: white; color: #0a2460; border-radius: 6px; text-decoration: none; font-weight: 600; text-align: center;">
                                Boka demo →
                            </a>
                            <a href="https://www.selma.se/kontakt" 
                               onclick="if(window.ScannerTracking) window.ScannerTracking.trackConversion('contact_click', {source: 'cta_banner', website: '${domain}', status: 'compliant'});"
                               style="flex: 1; min-width: 140px; padding: 12px 24px; background: rgba(255,255,255,0.2); color: white; border: 1px solid white; border-radius: 6px; text-decoration: none; font-weight: 600; text-align: center;">
                                Kontakta oss
                            </a>
                        </div>
                    </div>
                `;
            } else {
                // RÖD - Not Accessible
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
                               style="flex: 1; min-width: 140px; padding: 12px 24px; background: white; color: #0a2460; border-radius: 6px; text-decoration: none; font-weight: 600; text-align: center;">
                                Boka demo →
                            </a>
                            <a href="https://www.selma.se/kontakt" 
                               onclick="if(window.ScannerTracking) window.ScannerTracking.trackConversion('contact_click', {source: 'cta_banner', website: '${domain}', status: 'non_compliant', issues: ${issuesCount}});"
                               style="flex: 1; min-width: 140px; padding: 12px 24px; background: rgba(255,255,255,0.2); color: white; border: 1px solid white; border-radius: 6px; text-decoration: none; font-weight: 600; text-align: center;">
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
            
            console.log('✅ CTA overlay displayed | Compliant:', isCompliant);
        };
        
        // FIX 5: Lyssna på iframe messages
        window.addEventListener('message', function(event) {
            if (event.origin === Scanner.config.aceUrl || 
                event.origin.includes('acsbace.com')) {
                console.log('📨 Message from AccessiBe iframe:', event.data);
                
                setTimeout(() => {
                    const contactModal = document.getElementById('contactModal');
                    if (contactModal && contactModal.style.display !== 'block') {
                        console.log('📋 Showing contact modal after iframe message');
                        if (UI && typeof UI.showContactModal === 'function') {
                            UI.showContactModal(false, Scanner.session);
                        }
                    }
                }, 3000);
            }
        });
        
        // FIX 6: Övervaka formulär submit
        document.addEventListener('submit', function(e) {
            const form = e.target;
            if (form.id === 'contactForm' || form.classList.contains('contact-form')) {
                console.log('📤 Contact form submitted, will show CTA after delay');
                
                setTimeout(() => {
                    if (UI && Scanner.session) {
                        console.log('🎯 Showing CTA after contact form submission');
                        UI.showCTAOverlay(Scanner.session);
                    }
                }, 3000);
            }
        });
        
        // FIX 7: Failsafe - 10 sekunder
        setTimeout(() => {
            const contactModal = document.getElementById('contactModal');
            const enhancedModal = document.getElementById('enhancedModal') || 
                                 document.getElementById('modal66f5d0180130eb9ebefb1233');
            
            if (enhancedModal && enhancedModal.style.display === 'block') {
                if (!contactModal || contactModal.style.display !== 'block') {
                    console.log('⚠️ Failsafe: Forcing contact modal after 10 seconds');
                    if (UI && typeof UI.showContactModal === 'function') {
                        UI.showContactModal(false, Scanner.session);
                    }
                }
            }
        }, 10000);
        
        console.log('✅ ALL CRITICAL FIXES APPLIED SUCCESSFULLY!');
        console.log('📋 Contact modal will show after 5 seconds');
        console.log('🎯 CTA will show correct text based on compliance');
        console.log('⚠️ Failsafe triggers after 10 seconds if needed');
        
        // Verifiera att globala objekt fortfarande finns
        console.log('🔍 Verification:', {
            EnhancedScanner: !!window.EnhancedScanner,
            ScannerUI: !!window.ScannerUI,
            ScannerTracking: !!window.ScannerTracking
        });
    });
    
})();
