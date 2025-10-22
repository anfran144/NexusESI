<?php

declare(strict_types=1);

namespace App\Console\Commands;

use App\Mail\TestMail;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\Mail;

class SendTestEmail extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'email:test {email? : Email de destino}';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Enviar email de prueba para verificar configuración de SendGrid';

    /**
     * Execute the console command.
     */
    public function handle(): int
    {
        $email = $this->argument('email') ?? 'adiazciro@gmail.com';

        $this->info('🚀 Enviando email de prueba...');
        $this->line('');
        $this->info("📧 Destinatario: {$email}");
        $this->info("⚙️  Mailer: " . config('mail.default'));
        
        if (config('mail.default') === 'sendgrid') {
            $this->info("🌐 Método: SendGrid Web API");
            $this->info("🔑 API Key: " . (config('services.sendgrid.api_key') ? '✅ Configurada' : '❌ No configurada'));
        } else {
            $this->info("🌐 Host: " . config('mail.mailers.' . config('mail.default') . '.host', 'N/A'));
        }
        
        $this->line('');

        try {
            // Enviar email de prueba
            Mail::to($email)->send(new TestMail());

            $this->line('');
            $this->info('✅ Email enviado exitosamente!');
            $this->line('');
            $this->comment('Verifica tu bandeja de entrada (o spam) en: ' . $email);
            $this->line('');

            // Información adicional
            $this->info('📊 Detalles de la configuración:');
            
            $configData = [
                ['MAIL_MAILER', config('mail.default')],
            ];
            
            if (config('mail.default') === 'sendgrid') {
                $configData[] = ['Método', 'SendGrid Web API'];
                $configData[] = ['API Key', config('services.sendgrid.api_key') ? 'SG.****' . substr(config('services.sendgrid.api_key'), -8) : 'No configurada'];
            } else {
                $configData[] = ['MAIL_HOST', config('mail.mailers.smtp.host', 'N/A')];
                $configData[] = ['MAIL_PORT', config('mail.mailers.smtp.port', 'N/A')];
                $configData[] = ['MAIL_ENCRYPTION', config('mail.mailers.smtp.encryption', 'N/A')];
            }
            
            $configData[] = ['MAIL_FROM_ADDRESS', config('mail.from.address')];
            $configData[] = ['MAIL_FROM_NAME', config('mail.from.name')];
            
            $this->table(['Configuración', 'Valor'], $configData);

            return self::SUCCESS;
        } catch (\Exception $e) {
            $this->line('');
            $this->error('❌ Error al enviar el email');
            $this->line('');
            $this->error('Mensaje de error:');
            $this->line($e->getMessage());
            $this->line('');
            
            $this->warn('💡 Verifica tu configuración en .env:');
            
            if (config('mail.default') === 'sendgrid') {
                $this->line('   - MAIL_MAILER=sendgrid');
                $this->line('   - SENDGRID_API_KEY=SG.xxxxxxxxxxxxxxxx');
                $this->line('   - MAIL_FROM_ADDRESS=tu_email@verificado.com');
                $this->line('');
                $this->warn('💡 También verifica en SendGrid:');
                $this->line('   1. Que la API Key tenga permisos de "Mail Send"');
                $this->line('   2. Que tu "Sender Identity" esté verificado en SendGrid');
                $this->line('   3. Ve a: https://app.sendgrid.com/settings/sender_auth');
            } else {
                $this->line('   - MAIL_MAILER=smtp');
                $this->line('   - MAIL_HOST=smtp.sendgrid.net');
                $this->line('   - MAIL_PORT=587');
                $this->line('   - MAIL_USERNAME=apikey');
                $this->line('   - MAIL_PASSWORD=tu_sendgrid_api_key');
                $this->line('   - MAIL_ENCRYPTION=tls');
            }
            
            if (config('app.debug')) {
                $this->line('');
                $this->error('Stack trace (modo debug activo):');
                $this->line($e->getTraceAsString());
            }

            return self::FAILURE;
        }
    }
}
