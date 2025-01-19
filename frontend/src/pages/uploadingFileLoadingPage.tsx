import { Loader2 } from 'lucide-react';
import { Progress } from '@/components/ui/progress';
import { cn } from '@/lib/utils';

export function UploadingFile({ progress }: { progress: number }) {
    return (
        <div className="flex justify-center items-center bg-gradient-to-br from-background to-secondary min-h-screen">
            <div className={cn(
                "transition-all duration-700 transform",
                "translate-y-0 opacity-100"
            )}>
                <div className="space-y-8 text-center">
                    <div className="relative mx-auto w-24 h-24">
                        <div className="absolute inset-0 border-primary border-t-2 rounded-full animate-spin" />
                        <div className="absolute inset-[6px] border-primary/80 border-t-2 rounded-full animate-spin-slow" />
                        <div className="absolute inset-[12px] border-primary/60 border-t-2 rounded-full animate-spin-slower" />
                        <Loader2 className="absolute inset-0 m-auto w-12 h-12 text-primary animate-pulse" />
                    </div>

                    <div className="space-y-4 max-w-[300px]">
                        <h2 className="font-bold text-2xl tracking-tight">Uploading File</h2>
                        <p className="text-muted-foreground text-sm">
                            Please wait while we are uploading ...
                        </p>
                        <Progress value={progress} className="w-[250px] h-2" />
                        <p className="text-muted-foreground text-xs">{progress}% Complete</p>
                    </div>
                </div>
            </div>
        </div>
    );
}
